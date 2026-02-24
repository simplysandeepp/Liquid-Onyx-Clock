import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type ViewMode = 'clock' | 'timer' | 'stopwatch'
type ThemeId = 'onyx' | 'gold' | 'frost'

interface LapEntry {
  id: number
  elapsedMs: number
  recordedAt: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface WakeLockSentinelLike extends EventTarget {
  released: boolean
  release: () => Promise<void>
}

const STORAGE_KEYS = {
  theme: 'liquid-onyx-theme',
  recentDurations: 'liquid-onyx-recent-durations',
  lapHistory: 'liquid-onyx-lap-history',
} as const

const TIMER_PRESETS = [300, 900, 1800, 3600]

const THEME_OPTIONS: Array<{
  id: ThemeId
  label: string
  preview: string
}> = [
  { id: 'onyx', label: 'Glossy Black', preview: 'linear-gradient(135deg, #0e0e0e, #040404)' },
  { id: 'gold', label: 'Liquid Gold', preview: 'linear-gradient(135deg, #5A3E18, #CC9E3D)' },
  { id: 'frost', label: 'Abstract Frost', preview: 'linear-gradient(135deg, #8CA4B8, #D8E2EA)' },
]

function readStorage<T>(key: string, fallbackValue: T): T {
  try {
    const rawValue = localStorage.getItem(key)
    if (!rawValue) {
      return fallbackValue
    }

    return JSON.parse(rawValue) as T
  } catch {
    return fallbackValue
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Intentionally ignore storage failures (private mode / quota).
  }
}

function clampTimerValue(value: number): number {
  return Math.max(1, Math.round(value))
}

function pad(value: number, size = 2): string {
  return value.toString().padStart(size, '0')
}

function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }

  return `${pad(minutes)}:${pad(seconds)}`
}

function formatStopwatch(milliseconds: number): string {
  const safeValue = Math.max(0, milliseconds)
  const totalCentiseconds = Math.floor(safeValue / 10)
  const centiseconds = totalCentiseconds % 100
  const totalSeconds = Math.floor(totalCentiseconds / 100)
  const seconds = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const minutes = totalMinutes % 60
  const hours = Math.floor(totalMinutes / 60)

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`
  }

  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`
}

function getTimerPresetLabel(totalSeconds: number): string {
  if (totalSeconds % 3600 === 0) {
    return `${totalSeconds / 3600}h`
  }

  if (totalSeconds % 60 === 0) {
    return `${totalSeconds / 60}m`
  }

  return `${totalSeconds}s`
}

function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.click()
  URL.revokeObjectURL(objectUrl)
}

async function playTimerAlert(): Promise<void> {
  const maybeAudioContext = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!maybeAudioContext) {
    window.alert("Timer complete.")
    return
  }

  const context = new maybeAudioContext()
  const beepTimes = [0, 0.25, 0.5]

  beepTimes.forEach((offset, index) => {
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = index === 2 ? 1046 : 880
    gainNode.gain.setValueAtTime(0.001, context.currentTime + offset)
    gainNode.gain.exponentialRampToValueAtTime(0.24, context.currentTime + offset + 0.03)
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + offset + 0.22)
    oscillator.connect(gainNode)
    gainNode.connect(context.destination)
    oscillator.start(context.currentTime + offset)
    oscillator.stop(context.currentTime + offset + 0.24)
  })

  window.setTimeout(() => {
    void context.close()
  }, 1200)
}

function App() {
  const [mode, setMode] = useState<ViewMode>('clock')
  const [theme, setTheme] = useState<ThemeId>(() => readStorage(STORAGE_KEYS.theme, 'onyx'))
  const [now, setNow] = useState(() => new Date())
  const [menuOpen, setMenuOpen] = useState(false)
  const [idle, setIdle] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement))
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  const [recentDurations, setRecentDurations] = useState<number[]>(() =>
    readStorage(STORAGE_KEYS.recentDurations, TIMER_PRESETS),
  )
  const [timerInputMinutes, setTimerInputMinutes] = useState('10')
  const [timerDurationSeconds, setTimerDurationSeconds] = useState(600)
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(600)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerDeadlineRef = useRef<number | null>(null)
  const timerAlarmPlayedRef = useRef(false)

  const [stopwatchRunning, setStopwatchRunning] = useState(false)
  const [stopwatchElapsedMs, setStopwatchElapsedMs] = useState(0)
  const [laps, setLaps] = useState<LapEntry[]>(() => readStorage(STORAGE_KEYS.lapHistory, []))
  const stopwatchStartRef = useRef<number | null>(null)
  const stopwatchBaseRef = useRef(0)
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null)

  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches
    || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)

  const releaseWakeLock = async () => {
    if (!wakeLockRef.current) {
      return
    }

    try {
      await wakeLockRef.current.release()
    } catch {
      // Ignore release errors from browser wake lock API.
    } finally {
      wakeLockRef.current = null
    }
  }

  const requestWakeLock = async () => {
    const wakeLockApi = 'wakeLock' in navigator
      ? (navigator as Navigator & {
          wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
        }).wakeLock
      : undefined

    if (!wakeLockApi || !isFullscreen || document.hidden) {
      return
    }

    if (wakeLockRef.current && !wakeLockRef.current.released) {
      return
    }

    try {
      wakeLockRef.current = await wakeLockApi.request('screen')
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null
      })
    } catch {
      // Wake lock can be blocked by OS/browser policy.
    }
  }

  useEffect(() => {
    const timeInterval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(timeInterval)
    }
  }, [])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.theme, theme)
  }, [theme])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.recentDurations, recentDurations)
  }, [recentDurations])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.lapHistory, laps)
  }, [laps])

  useEffect(() => {
    let idleTimeout = 0

    const resetIdle = () => {
      setIdle(false)
      window.clearTimeout(idleTimeout)
      idleTimeout = window.setTimeout(() => {
        setIdle(true)
      }, 3000)
    }

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'touchmove',
    ]

    events.forEach((eventName) => window.addEventListener(eventName, resetIdle, { passive: true }))
    resetIdle()

    return () => {
      window.clearTimeout(idleTimeout)
      events.forEach((eventName) => window.removeEventListener(eventName, resetIdle))
    }
  }, [])

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', syncFullscreen)
    syncFullscreen()

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen)
    }
  }, [])

  useEffect(() => {
    const requestFullscreen = async () => {
      if (document.fullscreenElement || !document.documentElement.requestFullscreen) {
        return
      }

      try {
        await document.documentElement.requestFullscreen()
      } catch {
        // Browsers may block fullscreen without an explicit user interaction.
      }
    }

    void requestFullscreen()
  }, [])

  useEffect(() => {
    if (isFullscreen) {
      void requestWakeLock()
      return
    }

    void releaseWakeLock()
  }, [isFullscreen])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isFullscreen) {
        void requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isFullscreen])

  useEffect(() => {
    return () => {
      void releaseWakeLock()
    }
  }, [])

  useEffect(() => {
    if (!timerRunning) {
      return
    }

    const updateTimer = () => {
      if (timerDeadlineRef.current === null) {
        return
      }

      const remaining = Math.max(0, (timerDeadlineRef.current - Date.now()) / 1000)
      setTimerRemainingSeconds(remaining)

      if (remaining <= 0 && !timerAlarmPlayedRef.current) {
        timerAlarmPlayedRef.current = true
        timerDeadlineRef.current = null
        setTimerRunning(false)
        void playTimerAlert()
      }
    }

    updateTimer()
    const timerInterval = window.setInterval(updateTimer, 100)

    return () => {
      window.clearInterval(timerInterval)
    }
  }, [timerRunning])

  useEffect(() => {
    if (!stopwatchRunning) {
      return
    }

    const updateStopwatch = () => {
      if (stopwatchStartRef.current === null) {
        return
      }

      const elapsedNow = stopwatchBaseRef.current + (Date.now() - stopwatchStartRef.current)
      setStopwatchElapsedMs(elapsedNow)
    }

    updateStopwatch()
    const stopwatchInterval = window.setInterval(updateStopwatch, 33)

    return () => {
      window.clearInterval(stopwatchInterval)
    }
  }, [stopwatchRunning])

  const rememberDuration = (seconds: number) => {
    setRecentDurations((current) => {
      const deduped = [seconds, ...current.filter((value) => value !== seconds)]
      return deduped.slice(0, 8)
    })
  }

  const applyTimerDuration = (seconds: number) => {
    const sanitized = clampTimerValue(seconds)
    timerAlarmPlayedRef.current = false
    timerDeadlineRef.current = null
    setTimerRunning(false)
    setTimerDurationSeconds(sanitized)
    setTimerRemainingSeconds(sanitized)
    setTimerInputMinutes(String(Math.ceil(sanitized / 60)))
    rememberDuration(sanitized)
  }

  const handleTimerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsedMinutes = Number(timerInputMinutes)

    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
      return
    }

    applyTimerDuration(parsedMinutes * 60)
  }

  const startTimer = () => {
    const startingValue = timerRemainingSeconds > 0 ? timerRemainingSeconds : timerDurationSeconds

    if (startingValue <= 0) {
      return
    }

    timerAlarmPlayedRef.current = false
    timerDeadlineRef.current = Date.now() + startingValue * 1000
    setTimerRunning(true)
  }

  const pauseTimer = () => {
    timerDeadlineRef.current = null
    setTimerRunning(false)
  }

  const resetTimer = () => {
    timerAlarmPlayedRef.current = false
    timerDeadlineRef.current = null
    setTimerRunning(false)
    setTimerRemainingSeconds(timerDurationSeconds)
  }

  const startStopwatch = () => {
    if (stopwatchRunning) {
      return
    }

    stopwatchStartRef.current = Date.now()
    stopwatchBaseRef.current = stopwatchElapsedMs
    setStopwatchRunning(true)
  }

  const stopStopwatch = () => {
    if (!stopwatchRunning) {
      return
    }

    if (stopwatchStartRef.current !== null) {
      const finalElapsed = stopwatchBaseRef.current + (Date.now() - stopwatchStartRef.current)
      stopwatchBaseRef.current = finalElapsed
      setStopwatchElapsedMs(finalElapsed)
    }

    stopwatchStartRef.current = null
    setStopwatchRunning(false)
  }

  const resetStopwatch = () => {
    stopwatchStartRef.current = null
    stopwatchBaseRef.current = 0
    setStopwatchRunning(false)
    setStopwatchElapsedMs(0)
    setLaps([])
  }

  const addLap = () => {
    const elapsedNow = stopwatchRunning && stopwatchStartRef.current !== null
      ? stopwatchBaseRef.current + (Date.now() - stopwatchStartRef.current)
      : stopwatchElapsedMs

    if (elapsedNow <= 0) {
      return
    }

    setLaps((existingLaps) => [
      {
        id: Date.now(),
        elapsedMs: elapsedNow,
        recordedAt: new Date().toISOString(),
      },
      ...existingLaps,
    ])
  }

  const exportLaps = (format: 'csv' | 'txt') => {
    if (laps.length === 0) {
      return
    }

    const orderedLaps = [...laps].reverse()
    const timestamp = new Date().toISOString().replaceAll(':', '-')

    if (format === 'csv') {
      const csvBody = orderedLaps
        .map((lap, index) => `${index + 1},${formatStopwatch(lap.elapsedMs)},${lap.recordedAt}`)
        .join('\n')
      const csvContent = `Lap,Elapsed,Recorded At\n${csvBody}`
      triggerDownload(`lap-history-${timestamp}.csv`, csvContent, 'text/csv;charset=utf-8')
      return
    }

    const textBody = orderedLaps
      .map((lap, index) => `Lap ${index + 1}: ${formatStopwatch(lap.elapsedMs)} @ ${lap.recordedAt}`)
      .join('\n')
    triggerDownload(`lap-history-${timestamp}.txt`, textBody, 'text/plain;charset=utf-8')
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
    } catch {
      // Some browsers block fullscreen in edge cases.
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      const isTypingContext = tag === 'INPUT' || tag === 'TEXTAREA' || Boolean(target?.isContentEditable)

      if (isTypingContext) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'f') {
        event.preventDefault()
        void toggleFullscreen()
        return
      }

      if (event.key === 'Escape') {
        setMenuOpen(false)

        if (document.fullscreenElement && document.exitFullscreen) {
          event.preventDefault()
          void document.exitFullscreen()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) {
      return
    }

    try {
      await deferredInstallPrompt.prompt()
      await deferredInstallPrompt.userChoice
    } finally {
      setDeferredInstallPrompt(null)
    }
  }

  const clockValue = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const clockDate = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const timerDisplaySeconds = Math.ceil(timerRemainingSeconds)
  const timerCanStart = !timerRunning && timerRemainingSeconds > 0.05
  const timerHasProgress = timerRemainingSeconds < (timerDurationSeconds - 0.05)
  const timerShowReset = timerRunning || timerHasProgress
  const stopwatchHasTime = stopwatchElapsedMs > 0

  const renderClock = () => (
    <div className="glass-panel panel-shell w-full max-w-6xl px-7 py-16 sm:px-12 sm:py-20">
      <h1 className="clock-digits">{clockValue}</h1>
      <p className="mt-5 text-base text-[color:var(--text-muted)] sm:text-lg">{clockDate}</p>
    </div>
  )

  const renderTimer = () => (
    <div className="glass-panel panel-shell w-full max-w-5xl px-6 py-10 sm:px-10 sm:py-12">
      <h2 className="text-7xl font-semibold tracking-[0.1em] sm:text-8xl lg:text-9xl">
        {formatCountdown(timerDisplaySeconds)}
      </h2>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {timerCanStart ? (
          <button type="button" className="pill-button" onClick={startTimer}>
            Start
          </button>
        ) : null}
        {timerRunning ? (
          <button type="button" className="pill-button" onClick={pauseTimer}>
            Stop
          </button>
        ) : null}
        {timerShowReset ? (
          <button type="button" className="ghost-button" onClick={resetTimer}>
            Reset
          </button>
        ) : null}
      </div>

      {!timerRunning ? (
        <div className="mt-10 space-y-6">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Presets</p>
            <div className="flex flex-wrap gap-3">
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`ghost-button ${timerDurationSeconds === preset ? 'active' : ''}`}
                  onClick={() => applyTimerDuration(preset)}
                >
                  {getTimerPresetLabel(preset)}
                </button>
              ))}
            </div>
          </div>

          <form className="flex flex-wrap gap-2" onSubmit={handleTimerSubmit}>
            <label htmlFor="custom-minutes" className="sr-only">
              Custom minutes
            </label>
            <input
              id="custom-minutes"
              inputMode="numeric"
              type="number"
              min={1}
              step={1}
              className="min-w-[220px] flex-1 rounded-full border border-white/20 bg-black/30 px-5 py-3 text-base text-white outline-none transition focus:border-white/40"
              value={timerInputMinutes}
              onChange={(event) => setTimerInputMinutes(event.target.value)}
              placeholder="Custom minutes"
            />
            <button type="submit" className="pill-button">
              Apply
            </button>
          </form>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Recent</p>
            <div className="flex flex-wrap gap-3">
              {recentDurations.map((seconds) => (
                <button
                  key={`recent-${seconds}`}
                  type="button"
                  className="ghost-button"
                  onClick={() => applyTimerDuration(seconds)}
                >
                  {getTimerPresetLabel(seconds)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  const renderStopwatch = () => (
    <div className="glass-panel panel-shell w-full max-w-5xl px-6 py-10 sm:px-10 sm:py-12">
      <h2 className="text-6xl font-semibold tracking-[0.08em] sm:text-7xl lg:text-8xl">
        {formatStopwatch(stopwatchElapsedMs)}
      </h2>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {!stopwatchRunning ? (
          <button type="button" className="pill-button" onClick={startStopwatch}>
            Start
          </button>
        ) : (
          <button type="button" className="pill-button" onClick={stopStopwatch}>
            Stop
          </button>
        )}
        {stopwatchRunning ? (
          <button type="button" className="ghost-button" onClick={addLap}>
            Lap
          </button>
        ) : null}
        {!stopwatchRunning && stopwatchHasTime ? (
          <button type="button" className="ghost-button" onClick={resetStopwatch}>
            Reset
          </button>
        ) : null}
      </div>

      {laps.length > 0 ? (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className="ghost-button" onClick={() => exportLaps('csv')}>
            Export CSV
          </button>
          <button type="button" className="ghost-button" onClick={() => exportLaps('txt')}>
            Export TXT
          </button>
        </div>
      ) : null}

      <div className="mt-8 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-4 text-left">
        {laps.length === 0 ? (
          <p className="text-base text-[color:var(--text-muted)]">No laps recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {laps.map((lap, index) => {
              const lapNumber = laps.length - index
              return (
                <li key={lap.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                  <span className="text-base text-[color:var(--text-muted)]">Lap {lapNumber}</span>
                  <span className="text-base font-medium">{formatStopwatch(lap.elapsedMs)}</span>
                  <span className="text-sm text-[color:var(--text-muted)]">
                    {new Date(lap.recordedAt).toLocaleTimeString()}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )

  return (
    <main className={`app-shell theme-${theme} ${idle ? 'idle-mode' : ''}`}>
      <svg className="hidden" aria-hidden="true">
        <filter id="liquid-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -12"
            result="liquid"
          />
          <feComposite in="SourceGraphic" in2="liquid" operator="atop" />
        </filter>
      </svg>

      <div className="liquid-canvas" aria-hidden="true">
        <div className="goo-wrap">
          <span className="blob blob-a" />
          <span className="blob blob-b" />
          <span className="blob blob-c" />
          <span className="blob blob-d" />
        </div>
      </div>

      <div className={`control-chrome fixed right-0 top-0 z-40 ${menuOpen ? 'menu-open' : ''}`}>
        <button
          type="button"
          className="icon-button"
          aria-expanded={menuOpen}
          aria-label="Open controls"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <aside className={`menu-panel ${menuOpen ? 'open' : ''}`}>
          <div>
            <p className="menu-heading">View</p>
            <div className="mt-2 flex gap-2">
              {(['clock', 'timer', 'stopwatch'] as ViewMode[]).map((view) => (
                <button
                  key={view}
                  type="button"
                  className={`ghost-button ${mode === view ? 'active' : ''}`}
                  onClick={() => {
                    setMode(view)
                    setMenuOpen(false)
                  }}
                >
                  {view[0].toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="menu-heading">Themes</p>
            <div className="mt-2 grid gap-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`theme-item ${theme === option.id ? 'active' : ''}`}
                  onClick={() => setTheme(option.id)}
                >
                  <span className="theme-dot" style={{ background: option.preview }} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" className="ghost-button" onClick={() => void toggleFullscreen()}>
              {isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F)'}
            </button>
            {deferredInstallPrompt ? (
              <button type="button" className="pill-button" onClick={() => void handleInstallApp()}>
                Install App
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-[color:var(--text-muted)]">Shortcut: F fullscreen, Esc exit.</p>

          {!deferredInstallPrompt && isIOS && !isStandalone ? (
            <p className="mt-3 text-xs text-[color:var(--text-muted)]">
              On iPhone/iPad: use Share and select Add to Home Screen.
            </p>
          ) : null}
        </aside>
      </div>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full text-center">
          {mode === 'clock' && renderClock()}
          {mode === 'timer' && renderTimer()}
          {mode === 'stopwatch' && renderStopwatch()}
        </div>
      </section>

      <p className="quote-tagline">
        Believe in yourself, for you are a child of Eternal.
      </p>
    </main>
  )
}

export default App

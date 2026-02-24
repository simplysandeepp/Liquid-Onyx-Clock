# Liquid Onyx Clock

Premium glassmorphic clock experience built with React + Vite + TypeScript + Tailwind, with timer, stopwatch, fullscreen screensaver behavior, and installable PWA support.

[![Open Premium Web App](https://img.shields.io/badge/Open-Premium_Web_App-111111?style=for-the-badge&logo=vercel&logoColor=white)](https://liquid-onyx-clock.vercel.app/)

Live URL: https://liquid-onyx-clock.vercel.app/

## Highlights

- Liquid, glossy, dark visual system with animated gooey background.
- Three working modes: Clock, Timer, Stopwatch.
- Hamburger control panel includes mode switch, theme switcher, and 12h/24h clock format.
- Fullscreen support with keyboard shortcuts.
- Installable PWA support for desktop, tablet, and mobile.
- Wake Lock integration (best effort) for immersive fullscreen use.

## Mode Details

### Clock

- Large central digital clock.
- Date display below the clock.
- 12h/24h toggle persisted in localStorage.

### Timer

- Presets: 5m, 15m, 30m, 1h.
- Custom minutes input.
- Start, Stop, Reset with contextual controls.
- Audio alert on completion.
- Display scales larger while running.

### Stopwatch

- Start, Stop, Lap, Reset actions.
- Lap list with timestamps.
- Export laps to `.csv` or `.txt`.
- Display scales larger while running.

## Persistence

Stored in `localStorage`:

- Active theme
- Clock format (12h/24h)
- Timer recent duration logic
- Stopwatch lap history

## PWA Support (Desktop / Tablet / Mobile)

- `vite-plugin-pwa` with generated service worker + web manifest.
- Offline caching support.
- Install flow:
  - Chromium browsers: native install prompt/button.
  - iOS Safari: Share -> Add to Home Screen.
- Includes app icons, maskable icon, and Apple touch icon.

## Tech Stack

- React 19
- TypeScript
- Vite 7
- Tailwind CSS
- Custom CSS animations
- `vite-plugin-pwa`

## Keyboard and UX Notes

- `F` toggles fullscreen.
- `Esc` exits fullscreen.
- Inactivity hides controls and cursor for immersive mode.
- Browser/OS policies may still limit automatic fullscreen and wake lock behavior.

## Glimpse

<img width="1919" height="1084" alt="image" src="https://github.com/user-attachments/assets/8713a25c-f3c6-44a5-b53b-0d7b4e11a948" />
<img width="1919" height="1081" alt="image" src="https://github.com/user-attachments/assets/9375b2b3-f2a1-4e67-a0cf-f990366445b5" />
<img width="1919" height="1086" alt="image" src="https://github.com/user-attachments/assets/e033afa4-9b58-4cda-b4fb-e527a4f08ecb" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/e32da709-e404-47c9-9104-9e970820cc7e" />
<img width="1919" height="1084" alt="image" src="https://github.com/user-attachments/assets/c39f6a56-5381-4a1e-889b-e2a03d79212a" />
<img width="1911" height="1086" alt="image" src="https://github.com/user-attachments/assets/59f4ce4f-e62f-495e-8635-a52b2dca8ae7" />
<img width="561" height="945" alt="image" src="https://github.com/user-attachments/assets/57bf1c06-ca26-4a02-b7f2-5245692fb828" />

## Found a Bug? Please Create an Issue

If you find any bug, please create an issue with these steps:

1. Open the GitHub repository issues tab.
2. Click **New issue**.
3. Add a clear title (example: `Timer not resetting on mobile Safari`).
4. Describe exact steps to reproduce.
5. Mention expected behavior and actual behavior.
6. Add screenshots/video and device details (OS, browser, version).
7. Submit the issue.

Thank you. Hope you like this project.

## License

Private project.

<img src="https://user-images.githubusercontent.com/74038190/225813708-98b745f2-7d22-48cf-9150-083f1b00d6c9.gif" width="500">

# Liquid Onyx Clock

Premium glassmorphic clock experience built with React + Vite + TypeScript + Tailwind, with timer, stopwatch, fullscreen screensaver behavior, and installable PWA support.

[![Open Premium Web App](https://img.shields.io/badge/Open-Premium_Web_App-111111?style=for-the-badge&logo=vercel&logoColor=white)](https://liquid-onyx-clock.vercel.app/)

Live URL: https://liquid-onyx-clock.vercel.app/

## Highlights

- Liquid, glossy, dark visual system with animated gooey background.
- Three working modes: Clock, Timer, Stopwatch.
- Hamburger control panel with:
  - Mode switch
  - Theme switcher (Glossy Black, Liquid Gold, Abstract Frost)
  - Clock format switcher (12h / 24h)
  - Fullscreen controls
  - PWA install prompt when supported
  - Premium CTA and developer link
- Screensaver interaction:
  - Cursor and control chrome auto-hide after inactivity
  - Instant reveal on movement/touch/key input
- Fullscreen shortcuts:
  - `F` to toggle fullscreen
  - `Esc` to exit fullscreen and close menu
- Wake Lock integration (best effort) to keep screen active in fullscreen mode.

## Mode Details

### Clock

- Large central digital clock.
- Date display below clock.
- 12h/24h toggle from menu is persisted in localStorage.

### Timer

- Presets: 5m, 15m, 30m, 1h.
- Custom minutes input.
- Start, Stop, Reset logic with contextual controls.
- Running state hides setup options for clean focus.
- Audio alert on completion.
- Time display scales larger while running.

### Stopwatch

- Start, Stop, Lap, Reset actions.
- Lap list with timestamped entries.
- Export laps to `.csv` or `.txt`.
- Time display scales larger while running.

## Persistence

Stored in `localStorage`:

- Active theme
- Clock format (12h/24h)
- Timer recent durations (logic retained)
- Stopwatch lap history

## PWA Support (Desktop / Tablet / Mobile)

- Vite PWA plugin configured with service worker and manifest.
- Offline caching through generated service worker.
- Install flow support:
  - Chromium browsers: native install prompt/button.
  - iOS Safari: Share -> Add to Home Screen.
- Includes web app icons + maskable icon + Apple touch icon.

## Tech Stack

- React 19
- TypeScript
- Vite 7
- Tailwind CSS
- Custom CSS animations
- `vite-plugin-pwa`

## Project Structure

- `src/App.tsx` - app logic, modes, controls, keyboard/fullscreen behavior.
- `src/App.css` - visual system, glass styles, motion, component styles.
- `src/main.tsx` - app bootstrap + service worker registration.
- `vite.config.ts` - Vite + PWA plugin + manifest config.
- `public/` - icon assets for PWA and Apple touch.
- `vercel.json` - Vercel build/output/routing configuration.
- `.vercelignore` - deployment upload exclusions.

## Local Development

Requirements:

- Node.js 18+ recommended
- npm

Install and run:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`

## Scripts

- `npm run dev` - local development.
- `npm run dev:network` - dev server accessible on local network.
- `npm run build` - typecheck + production build.
- `npm run preview` - preview production build locally.
- `npm run preview:network` - network preview build.

## Deploy to Vercel

This repo is already prepared for Vercel.

### Option 1: Git Integration

1. Push repository to GitHub/GitLab/Bitbucket.
2. Import project into Vercel.
3. Keep defaults:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy.

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

## Keyboard and UX Notes

- `F` toggles fullscreen.
- `Esc` exits fullscreen.
- Inactivity hides controls and cursor for immersive mode.
- Browser/OS policies can still limit automatic fullscreen and wake lock behavior.

## Branding / Links

Inside hamburger menu footer:

- Premium button -> `https://liquid-onyx-clock.vercel.app/`
- Developer button -> creator profile link

## License

Private project. Update this section if you plan to open-source it.

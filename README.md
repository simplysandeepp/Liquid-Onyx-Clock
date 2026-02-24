# Liquid Onyx Clock (PWA)

Premium digital clock, timer, and stopwatch built with React + Vite + TypeScript + Tailwind.

## Scripts

- `npm run dev` - local development
- `npm run dev:network` - local network development (test on phone/tablet)
- `npm run build` - production build
- `npm run preview` - preview built app
- `npm run preview:network` - preview on local network

## Deploy To Vercel

This project is pre-configured for Vercel with:

- `vercel.json`
- `.vercelignore`

### Option 1: Git Integration (recommended)

1. Push this project to GitHub/GitLab/Bitbucket.
2. In Vercel, click **Add New Project** and import the repo.
3. Keep detected settings (already aligned):
   - Framework: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy.

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

## PWA Install

- Desktop/Android: use browser install prompt/button.
- iOS/iPadOS (Safari): Share -> Add to Home Screen.

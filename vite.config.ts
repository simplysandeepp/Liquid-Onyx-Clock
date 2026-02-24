import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: null,
      registerType: 'autoUpdate',
      includeAssets: [
        'app-icon.svg',
        'app-icon-maskable.svg',
        'app-icon-192.png',
        'app-icon-512.png',
        'app-icon-maskable-512.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'Liquid Onyx Clock',
        short_name: 'Liquid Onyx',
        description: 'Premium glossy liquid clock screensaver PWA.',
        theme_color: '#040404',
        background_color: '#040404',
        display: 'standalone',
        scope: '/',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: 'app-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'app-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'app-icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
})

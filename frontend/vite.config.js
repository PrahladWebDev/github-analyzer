import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'GitHub Personality Analyzer',
        short_name: 'GH Analyzer',
        description:
          'Analyze any GitHub profile: language breakdown, commit activity, personality radar, career timeline and AI-generated summaries.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait-primary',
        background_color: '#0d1117',
        theme_color: '#0d1117',
        categories: ['developer', 'productivity', 'utilities'],
        icons: [
          { src: '/icon-72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // App shell / static assets built by Vite are precached automatically.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
        navigateFallback: '/index.html',
        // Never let the app shell fall back to a stale index.html for API calls.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // GitHub analysis / AI summary calls: always try the network first
            // (data changes constantly), fall back to the last good response
            // when offline so a repeat lookup still shows something useful.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 } // 1 day
            }
          },
          {
            // GitHub avatar images etc.
            urlPattern: ({ url }) =>
              url.origin === 'https://avatars.githubusercontent.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatar-cache',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } // 30 days
            }
          }
        ]
      },
      devOptions: {
        // Enable the service worker in `vite dev` too, so installability /
        // offline behavior can be tested without a full production build.
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});

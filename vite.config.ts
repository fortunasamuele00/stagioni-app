import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Solo in sviluppo: serve seed-data/ sotto /seed/, così l'app gira senza repo collegato.
// Nella build questi file non entrano.
function seed(): Plugin {
  return {
    name: 'seed-data',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/seed/', async (req, res) => {
        const rel = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/+/, '');
        if (rel.includes('..')) { res.statusCode = 400; res.end(); return; }
        try {
          const body = await readFile(resolve(server.config.root, 'seed-data', rel));
          res.setHeader('Content-Type', 'application/json');
          res.end(body);
        } catch {
          res.statusCode = 404;
          res.end();
        }
      });
    },
  };
}

// base relativa: la stessa build funziona in locale e su GitHub Pages sotto /stagioni-app/.
export default defineConfig({
  base: './',
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
  plugins: [
    seed(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Stagioni',
        short_name: 'Stagioni',
        description: 'La stagione in corso: scene del giorno, antagonisti, episodi e lista dei 30 giorni.',
        lang: 'it',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F2F0ED',
        theme_color: '#F2F0ED',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Font disponibili offline dopo la prima apertura. Le chiamate a GitHub non passano mai dalla cache.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'font', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
});

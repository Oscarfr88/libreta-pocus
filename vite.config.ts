import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base '/libreta-pocus/' → GitHub Pages project site (oscarfr88.github.io/libreta-pocus).
export default defineConfig({
  base: '/libreta-pocus/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      manifest: {
        name: 'Libreta de competencias POCUS',
        short_name: 'Libreta POCUS',
        description: 'Registro de prácticas supervisadas de ultrasonografía clínica (POCUS) y validación del instructor.',
        lang: 'es',
        theme_color: '#0e7490',
        background_color: '#f1f5f9',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/libreta-pocus/',
        start_url: '/libreta-pocus/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Fuera del precacheo: subconjuntos de la fuente que el español no usa y módulos
        // opcionales de jsPDF (html2canvas, DOMPurify, canvg) que esta app nunca carga.
        globIgnores: ['**/inter-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*', '**/html2canvas*', '**/purify*', '**/index.es-*'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/libreta-pocus/index.html',
      },
    }),
  ],
  server: { port: 5175, open: false, host: true },
  preview: { port: 5176, host: true },
});

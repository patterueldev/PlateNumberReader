import { readFile, writeFile } from 'node:fs/promises';
import workbox from 'workbox-build';

const { generateSW } = workbox;

const indexPath = 'dist/index.html';
const appTitle = 'PlateNumberReader';
const headTags = [
  '<meta name="theme-color" content="#F3F5F9" media="(prefers-color-scheme: light)" />',
  '<meta name="theme-color" content="#0B1220" media="(prefers-color-scheme: dark)" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="PlateReader" />',
  '<meta name="description" content="Scan or enter a Philippine plate number to see your LTO registration renewal window, expiry, and calendar reminders." />',
  '<link rel="manifest" href="/manifest.json" />',
  '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />',
].join('\n    ');

const swBootstrap = `<script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function () {});
        });
      }
    </script>`;

let html = await readFile(indexPath, 'utf8');
const original = html;

html = html.replace(/<title>[^<]*<\/title>/, `<title>${appTitle}</title>`);
if (!html.includes('manifest.json')) {
  html = html.replace('</head>', `  ${headTags}\n  </head>`);
}
if (!html.includes('serviceWorker')) {
  html = html.replace('</body>', `  ${swBootstrap}\n</body>`);
}

if (html !== original) {
  await writeFile(indexPath, html);
  console.log('Injected PWA meta tags and service worker bootstrap into dist/index.html');
}

const { count, size, warnings } = await generateSW({
  globDirectory: 'dist',
  globPatterns: ['**/*.{js,html,css,png,ico,json,svg,woff2,ttf}'],
  globIgnores: ['tesseract/**', 'sw.js', 'workbox-*.js'],
  swDest: 'dist/sw.js',
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/tesseract\//],
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
  clientsClaim: true,
  skipWaiting: true,
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    {
      urlPattern: /\/tesseract\/.*\.(?:js|gz|wasm)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tesseract-ocr',
        expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|webp|svg)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
});

for (const warning of warnings) {
  console.warn(warning);
}
console.log(`Service worker generated: ${count} precached entries, ${(size / 1024).toFixed(0)} KiB total.`);

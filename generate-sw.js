import { injectManifest } from 'workbox-build';

const manifestEntries = [
  { url: '/', revision: '1' },
  { url: '/index.html', revision: '1' },
  { url: '/favicon.png', revision: '1' },
  { url: '/logo.png', revision: '1' },
  { url: '/manifest.json', revision: '1' },
  { url: '/placeholder.png', revision: '1' },
  { url: '/marker-icon-2x.png', revision: '2' },
  { url: '/marker-icon.png', revision: '2' },
  { url: '/marker-shadow.png', revision: '2' },
  { url: '/layers-2x.png', revision: '1' },
  { url: '/layers.png', revision: '1' },
];

injectManifest({
  swSrc: 'public/sw.js',
  swDest: 'dist/sw.js',
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,png,jpg,svg,ico,json}'],
  globIgnores: ['sw.js', '**/sw.js'],
  additionalManifestEntries: manifestEntries,
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
})
  .then(({ count, size, warnings }) => {
    if (warnings.length > 0) {
      console.warn('Peringatan saat injeksi manifest:', warnings);
    }
    console.log(`Service worker dihasilkan dengan ${count} file precache, total ${size} bytes.`);
  })
  .catch((err) => {
    console.error('Gagal menghasilkan service worker:', err);
    process.exit(1);
  });
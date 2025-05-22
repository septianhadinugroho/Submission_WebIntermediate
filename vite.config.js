import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    port: 3005,
  },
  preview: {
    port: 4173,
    mimeTypes: {
      'js': 'application/javascript',
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: ({ name }) => {
          if (name === 'sw.js') {
            return '[name].[ext]';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
  },
  publicDir: 'public',
});
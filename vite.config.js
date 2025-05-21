import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    port: 3005,
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
    },
  },
  publicDir: 'public',
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    copyPublicDir: true // Ensures root files like manifest.json are copied to dist
  },
  // We tell Vite to treat the root as the public directory so .well-known is included
  publicDir: '.', 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // Use our existing manifest.json at root
      workbox: {
        // Only cache the final built assets, don't try to cache source TSX files
        globPatterns: ['**/*.{js,css,html,json,png,jpg}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        // Exclude the assetlinks file from being cached/intercepted by Service Worker
        // to ensure Android always sees the fresh server version
        exclude: [/assetlinks\.json$/]
      }
    })
  ]
});
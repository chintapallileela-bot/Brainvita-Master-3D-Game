import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// Fix: Use ESM imports instead of require() for node modules in an ESM environment
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Fix: Polyfill __dirname which is not available by default in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    copyPublicDir: true
  },
  // Setting publicDir to false and handling static files carefully
  publicDir: false, 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // Use our manual manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,jpg}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        exclude: [/assetlinks\.json$/]
      }
    }),
    {
      name: 'copy-static-assets',
      apply: 'build',
      closeBundle() {
        // This simple plugin ensures these specific files make it to dist
        // Fix: Removed inline require() calls as they are replaced by top-level imports
        const dist = path.resolve(__dirname, 'dist');
        const wellKnown = path.join(dist, '.well-known');
        
        if (!fs.existsSync(wellKnown)) fs.mkdirSync(wellKnown, { recursive: true });
        
        // Copy critical files from root to dist
        try {
          fs.copyFileSync('manifest.json', path.join(dist, 'manifest.json'));
          fs.copyFileSync('.well-known/assetlinks.json', path.join(wellKnown, 'assetlinks.json'));
        } catch (e) {
          console.error('Failed to copy static assets:', e);
        }
      }
    }
  ]
});
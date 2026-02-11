import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './', // Use relative base to prevent origin mismatch errors in preview environments
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    copyPublicDir: true
  },
  publicDir: false, 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,jpg}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        globIgnores: ['**/.well-known/**', '**/assetlinks.json']
      }
    }),
    {
      name: 'copy-static-assets',
      apply: 'build',
      closeBundle() {
        const dist = path.resolve(__dirname, 'dist');
        const wellKnown = path.join(dist, '.well-known');
        
        if (!fs.existsSync(wellKnown)) fs.mkdirSync(wellKnown, { recursive: true });
        
        const filesToCopy = [
          { src: 'manifest.json', dest: 'manifest.json' },
          { src: '.well-known/assetlinks.json', dest: '.well-known/assetlinks.json' }
        ];

        filesToCopy.forEach(file => {
          const srcPath = path.resolve(__dirname, file.src);
          const destPath = path.resolve(dist, file.dest);
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Successfully copied ${file.src} to dist.`);
          } else {
            console.warn(`Source file not found: ${srcPath}`);
          }
        });
      }
    }
  ]
});
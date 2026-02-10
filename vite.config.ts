import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  build: {
    assetsDir: 'assets',
    outDir: 'dist',
    sourcemap: false
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', '.well-known/assetlinks.json'],
      manifest: {
        short_name: "Brainvita 3D",
        name: "Brainvita Master 3D: Peg Solitaire",
        description: "Classic puzzle with premium 3D graphics.",
        id: "com.brainvita.master3d.v1.6.5",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#020617",
        background_color: "#020617",
        icons: [
          {
            src: "https://i.postimg.cc/LsgKttrt/Brainvita-Icon.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "https://i.postimg.cc/LsgKttrt/Brainvita-Icon.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json}'],
        cleanupOutdatedCaches: true
      }
    })
  ]
});
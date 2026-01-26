import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        short_name: "Brainvita 3D",
        name: "Brainvita Master 3D: Peg Solitaire",
        description: "Classic puzzle with premium 3D graphics.",
        id: "com.brainvita.master3d.v126",
        start_url: "/?v=1.2.6",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#020617",
        background_color: "#020617",
        icons: [
          {
            src: "https://i.postimg.cc/LsgKttrt/Brainvita-Icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "https://i.postimg.cc/LsgKttrt/Brainvita-Icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'tailwind-cdn' }
          }
        ]
      }
    })
  ]
});
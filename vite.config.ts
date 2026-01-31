
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
        description: "Classic puzzle with premium 3D graphics and immersive themes.",
        id: "com.brainvita.master3d.v128",
        start_url: "/?v=1.2.8",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#020617",
        background_color: "#020617",
        categories: ["games", "puzzle"],
        icons: [
          {
            src: "https://i.postimg.cc/LsgKttrt/Brainvita-Icon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
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
        ],
        screenshots: [
           {
            src: "https://i.postimg.cc/W1HTMk80/Screenshot-20260130-152329-Chrome.jpg",
            type: "image/jpeg",
            sizes: "1080x2400",
            form_factor: "narrow"
          },
          {
            src: "https://i.postimg.cc/yxVMq1jL/Screenshot-20260130-152448-Chrome.jpg",
            type: "image/jpeg",
            sizes: "1080x2400",
            form_factor: "narrow"
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/i\.postimg\.cc\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-assets',
              expiration: {
                maxEntries: 50,
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'tailwind-cdn' }
          }
        ]
      }
    })
  ]
});

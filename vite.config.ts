import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['vite.svg'],
      manifest: {
        short_name: "Brainvita",
        name: "Brainvita Master 3D",
        description: "A classic single-player board game involving movement of marbles. Jump marbles to remove them and try to leave just one!",
        id: "/",
        start_url: "/",
        categories: ["game", "puzzle", "casual", "strategy"],
        // Strict icon definition: Only declaring 512x512 to avoid mismatch errors since we only have a high-res image
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
        ],
        // Removed 'sizes' from screenshots to avoid strict dimension mismatch errors in PWABuilder
        screenshots: [
          {
            src: "https://i.postimg.cc/rzwb1LBd/Nature.jpg",
            type: "image/jpeg",
            form_factor: "wide",
            label: "Immersive 3D Themes",
            sizes: "1280x720"
          },
          {
            src: "https://i.postimg.cc/GH3fjn62/Barbie.jpg",
            type: "image/jpeg",
            form_factor: "narrow",
            label: "Classic Gameplay",
            sizes: "720x1280"
          }
        ],
        shortcuts: [
          {
            name: "Play Now",
            short_name: "Play",
            description: "Start a new game of Brainvita",
            url: "/",
            icons: [{ 
              src: "https://i.postimg.cc/y6R5kVMY/Brainvita_Shortcut_Icon.png", 
              type: "image/png" 
            }]
          }
        ],
        // PWA Builder specific setting to avoid "Specify your native app" warning
        prefer_related_applications: false,
        launch_handler: {
          client_mode: "navigate-existing"
        },
        theme_color: "#020617",
        background_color: "#020617",
        display: "standalone",
        orientation: "portrait"
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tailwind-cdn',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/i\.postimg\.cc/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
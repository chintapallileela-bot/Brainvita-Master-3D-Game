import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        short_name: "Brainvita",
        name: "Brainvita Master 3D",
        description: "A classic single-player board game involving movement of marbles. Jump marbles to remove them and try to leave just one!",
        id: "/",
        start_url: "/",
        categories: ["game", "puzzle", "casual", "strategy"],
        icons: [
          {
            src: "https://i.postimg.cc/mrf6y73t/Brainvita-Icon.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "any maskable"
          },
          {
            src: "https://i.postimg.cc/mrf6y73t/Brainvita-Icon.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "any maskable"
          }
        ],
        screenshots: [
          {
            src: "https://i.postimg.cc/rzwb1LBd/Nature.jpg",
            sizes: "1280x720",
            type: "image/jpeg",
            form_factor: "wide",
            label: "Immersive 3D Themes"
          },
          {
            src: "https://i.postimg.cc/GH3fjn62/Barbie.jpg",
            sizes: "720x1280",
            type: "image/jpeg",
            form_factor: "narrow",
            label: "Classic Gameplay"
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
              sizes: "192x192", 
              type: "image/png" 
            }]
          }
        ],
        launch_handler: {
          client_mode: "navigate-existing"
        },
        theme_color: "#020617",
        background_color: "#020617",
        display: "standalone",
        orientation: "portrait"
      },
      workbox: {
        // Cache the Tailwind CDN and Google Fonts so the app works offline
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tailwind-cdn',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
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
            // Cache external images used for backgrounds/screenshots/icons
            urlPattern: /^https:\/\/i\.postimg\.cc/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
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
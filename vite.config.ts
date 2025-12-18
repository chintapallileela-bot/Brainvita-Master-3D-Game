import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['vite.svg'],
      manifest: {
        short_name: "Brainvita 3D",
        name: "Brainvita Master 3D: Peg Solitaire",
        description: "A classic single-player board game with stunning 3D themes and multiple layouts.",
        id: "com.brainvita.master3d",
        start_url: "/?utm_source=pwa&utm_medium=homescreen",
        categories: ["games", "puzzle", "strategy", "brain"],
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
            name: "New Game",
            short_name: "Play",
            description: "Start a new session of Brainvita",
            url: "/",
            icons: [{ 
              src: "https://i.postimg.cc/y6R5kVMY/Brainvita_Shortcut_Icon.png", 
              type: "image/png" 
            }]
          }
        ],
        prefer_related_applications: false,
        launch_handler: {
          client_mode: "navigate-existing"
        },
        theme_color: "#020617",
        background_color: "#020617",
        display: "standalone",
        orientation: "any"
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
              }
            }
          }
        ]
      }
    })
  ]
});
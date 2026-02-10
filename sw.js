// This file is now managed via VitePWA in vite.config.ts.
// Manual fallback to prevent 404s if registration is hardcoded elsewhere.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Register service worker with more resilience
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Standard registration. We use a simple relative string to avoid URL construction issues
    // in various proxy/sandbox environments.
    navigator.serviceWorker.register('sw.js', { scope: './' })
      .then((reg) => {
        console.log('SW Registered:', reg.scope);
      })
      .catch((err) => {
        // We log it but do not let it stop the app from running
        console.warn('Service Worker registration skipped:', err.message);
      });
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error('React mounting failed:', err);
    // Fallback UI for extreme cases
    rootElement.innerHTML = `
      <div style="color: white; padding: 40px; text-align: center; background: #020617; height: 100vh;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Brainvita Master 3D</h1>
        <p style="color: #94a3b8; margin-bottom: 24px;">Something went wrong while starting the game.</p>
        <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 12px; font-weight: bold;">Retry</button>
      </div>
    `;
  }
}
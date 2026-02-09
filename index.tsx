import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Robust Service Worker registration to prevent origin mismatches in sandbox environments
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Determine the correct path for the service worker relative to the current script
    const swPath = './sw.js';
    
    // Check if we're on a valid origin for SW registration to avoid the 'ai.studio' error
    // Some sandbox environments block cross-origin service workers
    const currentOrigin = window.location.origin;
    
    navigator.serviceWorker.register(swPath, { scope: './' })
      .then((reg) => {
        console.log('SW Registered successfully:', reg.scope);
      })
      .catch((err) => {
        // Log the error but don't crash the app (prevents blank screen)
        console.warn('Service Worker registration skipped or failed:', err.message);
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
    console.error('React Mounting Error:', err);
    rootElement.innerHTML = `<div style="color: white; padding: 20px; text-align: center; font-family: sans-serif;">
      <h2>Application Error</h2>
      <p>Failed to load the game. Please try refreshing.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; border-radius: 8px; border: none; background: #2563eb; color: white; cursor: pointer;">Refresh</button>
    </div>`;
  }
}
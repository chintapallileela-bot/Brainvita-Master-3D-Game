import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Robust error reporting for production devices
const reportFatalError = (err: any) => {
  console.error('Fatal App Error:', err);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: #020617; color: white; padding: 40px; text-align: center; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Brainvita Master 3D</h1>
        <p style="color: #94a3b8; max-width: 300px; margin-bottom: 24px;">Failed to start the engine. This might be due to an older system WebView.</p>
        <p style="color: #ef4444; font-size: 12px; margin-bottom: 24px; font-family: monospace;">${String(err)}</p>
        <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 14px 28px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">Retry Launch</button>
      </div>
    `;
  }
};

// Simplified Service Worker registration
const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      console.log('SW Registered:', registration.scope);
    } catch (err) {
      console.warn('SW Registration failed (this is non-critical for start):', err);
    }
  }
};

const mountApp = () => {
  const rootElement = document.getElementById('root');
  const loader = document.getElementById('initial-loader');

  if (rootElement) {
    try {
      const root = createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      
      // Remove loader once React has taken over
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }
    } catch (err) {
      reportFatalError(err);
    }
  }
};

// Sequence the startup
window.addEventListener('load', () => {
  registerSW();
  mountApp();
});

// Catch early uncaught errors
window.addEventListener('error', (event) => {
  if (event.message.includes('Script error')) return; // Ignore cross-origin issues from CDNs
  console.error('Global Error Detected:', event.error);
});

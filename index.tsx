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
        <p style="color: #94a3b8; max-width: 300px; margin-bottom: 24px;">Something prevented the game from starting. This is usually caused by an outdated System WebView.</p>
        <p style="color: #ef4444; font-size: 10px; margin-bottom: 24px; font-family: monospace; overflow-wrap: break-word; max-width: 80vw;">${String(err)}</p>
        <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 14px 28px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">Retry Launch</button>
      </div>
    `;
  }
};

const mountApp = () => {
  const rootElement = document.getElementById('root');
  const loader = document.getElementById('initial-loader');

  // SAFETY VALVE: If the app hasn't mounted in 6 seconds, something is stuck.
  // Force remove the loader so the user can see if an error message appeared.
  const safetyTimeout = setTimeout(() => {
    if (loader && loader.parentElement) {
       console.warn('Startup taking too long, forcing loader removal');
       loader.style.opacity = '0';
       setTimeout(() => loader.remove(), 500);
    }
  }, 6000);

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
        clearTimeout(safetyTimeout);
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }
    } catch (err) {
      clearTimeout(safetyTimeout);
      reportFatalError(err);
    }
  }
};

// Simplified SW registration to avoid origin/path conflicts in TWAs
const registerSW = () => {
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.warn('SW ignored:', err));
  }
};

// Sequence the startup
window.addEventListener('load', () => {
  registerSW();
  mountApp();
});

// Catch early uncaught errors (like Import Map failures)
window.addEventListener('error', (event) => {
  if (event.message.includes('Script error')) return; 
  console.error('Global Error:', event.error);
});

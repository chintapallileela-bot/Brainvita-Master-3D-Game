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
        <p style="color: #94a3b8; max-width: 300px; margin-bottom: 24px;">The game engine failed to start. This is usually caused by an outdated System WebView.</p>
        <p style="color: #ef4444; font-size: 10px; margin-bottom: 24px; font-family: monospace; overflow-wrap: break-word; max-width: 80vw;">${String(err)}</p>
        <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 14px 28px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">Retry Launch</button>
      </div>
    `;
  }
};

const mountApp = () => {
  const rootElement = document.getElementById('root');
  const loader = document.getElementById('initial-loader');

  // SAFETY VALVE: Hide loader after 5s regardless, to avoid infinite "Waking Up"
  const safetyTimeout = setTimeout(() => {
    if (loader && loader.style.opacity !== '0') {
       console.warn('App mount taking too long, forcing loader removal');
       loader.style.opacity = '0';
       setTimeout(() => loader.remove(), 500);
    }
  }, 5000);

  if (rootElement) {
    try {
      const root = createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      
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

// Start the app when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
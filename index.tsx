import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

declare global {
  interface Window {
    __BRAINVITA_CLEAR_WATCHDOG?: () => void;
    __APP_READY?: boolean;
  }
}

// Immediate visual confirmation that index.tsx is running
const loaderText = document.getElementById('loader-text');
if (loaderText) {
  loaderText.innerText = "Initializing 3D...";
  loaderText.style.color = "#3b82f6";
}

const reportFatalError = (err: any) => {
  const errMsg = String(err?.message || err);
  console.error('Fatal App Error:', err);

  const root = document.getElementById('root');
  if (root) {
    const loader = document.getElementById('initial-loader');
    if (loader) loader.remove();

    root.innerHTML = `
      <div style="background: #020617; color: white; padding: 40px; text-align: center; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif;">
        <h1 style="font-size: 18px; margin-bottom: 12px; font-weight: 900; color: #f43f5e; text-transform: uppercase;">IGNITION FAILED</h1>
        <p style="color: #94a3b8; max-width: 280px; margin-bottom: 24px; font-size: 12px; line-height: 1.5;">Module resolution failed on this browser. Try clearing your browser cache.</p>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #64748b; font-size: 8px; padding: 10px; border-radius: 10px; font-family: monospace; max-width: 85vw; margin-bottom: 24px; text-align: left; overflow-x: auto;">
          ${errMsg}
        </div>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 16px 32px; border: none; border-radius: 12px; font-weight: 900; font-size: 10px; text-transform: uppercase; cursor: pointer;">Force Reboot</button>
      </div>
    `;
  }
};

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Successful render call - clear the watchdog immediately
    window.__APP_READY = true;
    if (window.__BRAINVITA_CLEAR_WATCHDOG) {
      setTimeout(() => {
        window.__BRAINVITA_CLEAR_WATCHDOG?.();
      }, 150);
    }
  } catch (err) {
    reportFatalError(err);
  }
};

// Check ready state safely
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mountApp();
} else {
  window.addEventListener('load', mountApp);
}
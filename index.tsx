import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

declare global {
  interface Window {
    __BRAINVITA_CLEAR_WATCHDOG?: () => void;
    __APP_READY?: boolean;
    __APP_LOAD_START?: number;
  }
}

// Immediate feedback that the JS bundle is running
const loaderText = document.getElementById('loader-text');
if (loaderText) {
  loaderText.innerText = "Igniting Engine...";
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
        <h1 style="font-size: 20px; margin-bottom: 12px; font-weight: 900; color: #f43f5e; text-transform: uppercase;">IGNITION FAILED</h1>
        <p style="color: #94a3b8; max-width: 280px; margin-bottom: 24px; font-size: 13px; line-height: 1.5;">Your device may not support modern Web3D. Try updating your browser.</p>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #64748b; font-size: 9px; padding: 12px; border-radius: 12px; font-family: monospace; max-width: 80vw; margin-bottom: 24px; text-align: left; overflow-x: auto;">
          ${errMsg}
        </div>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 16px 32px; border: none; border-radius: 16px; font-weight: 800; font-size: 11px; text-transform: uppercase; cursor: pointer;">Retry Boot</button>
      </div>
    `;
  }
};

window.onerror = (msg, url, lineNo, columnNo, error) => {
  reportFatalError(error || msg);
  return false;
};

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    try {
      const root = createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      
      // CRITICAL: Signal readiness immediately after render call
      // This tells the watchdog that we have successfully ignited React
      window.__APP_READY = true;
      if (window.__BRAINVITA_CLEAR_WATCHDOG) {
        // Small delay to let the browser paint the first frame
        setTimeout(() => {
          window.__BRAINVITA_CLEAR_WATCHDOG?.();
        }, 200);
      }
    } catch (err) {
      reportFatalError(err);
    }
  }
};

// Handle DOM ready states
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
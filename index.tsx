import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

declare global {
  interface Window {
    __BRAINVITA_CLEAR_WATCHDOG?: () => void;
  }
}

// Robust error reporting for production devices
const reportFatalError = (err: any) => {
  // Clear the loader immediately if an error occurs to prevent "Waking Up" screen from blocking the error UI
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 500);
  }

  const errMsg = String(err?.message || err);
  if (errMsg.includes('ServiceWorker') || errMsg.includes('scriptURL') || errMsg.includes('origin')) {
    console.warn('Non-fatal system error ignored:', errMsg);
    return;
  }

  console.error('Fatal App Error:', err);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: #020617; color: white; padding: 40px; text-align: center; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; overflow: hidden;">
        <h1 style="font-size: 24px; margin-bottom: 16px; font-weight: 900; color: #f43f5e; letter-spacing: -0.02em;">BOOT ERROR</h1>
        <p style="color: #94a3b8; max-width: 320px; margin-bottom: 24px; font-size: 14px; line-height: 1.5;">The engine failed to ignite. This happens on some older mobile browsers or if memory is very low.</p>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 10px; padding: 16px; border-radius: 16px; font-family: monospace; overflow-wrap: break-word; max-width: 80vw; margin-bottom: 32px; text-align: left;">
          CODE: ${errMsg}
        </div>
        <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 20px 40px; border: none; border-radius: 24px; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.15em; font-size: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">Force Reload</button>
      </div>
    `;
  }
};

// Catch global unhandled errors
window.onerror = (msg, url, lineNo, columnNo, error) => {
  reportFatalError(error || msg);
  return false;
};

window.onunhandledrejection = (event) => {
  reportFatalError(event.reason);
};

const mountApp = () => {
  const rootElement = document.getElementById('root');
  const loader = document.getElementById('initial-loader');

  // Kill the HTML watchdog since JS has successfully started
  if (window.__BRAINVITA_CLEAR_WATCHDOG) {
    window.__BRAINVITA_CLEAR_WATCHDOG();
  }

  if (rootElement) {
    try {
      const root = createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      
      // Force removal of loader as soon as React starts its pass
      if (loader) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
          }, 100);
        });
      }
    } catch (err) {
      reportFatalError(err);
    }
  }
};

// Start the app with resilience
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  // If already loaded or interactive, mount immediately
  mountApp();
}

// Fallback: If 3 seconds pass and we haven't mounted correctly, force it.
setTimeout(() => {
  const loader = document.getElementById('initial-loader');
  if (loader && loader.style.opacity !== '0') {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 500);
  }
}, 3000);
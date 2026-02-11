import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Robust error reporting for production devices
const reportFatalError = (err: any) => {
  console.error('Fatal App Error:', err);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: #020617; color: white; padding: 40px; text-align: center; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif;">
        <h1 style="font-size: 24px; margin-bottom: 16px; font-weight: 900; color: #f43f5e;">BOOT FAILURE</h1>
        <p style="color: #94a3b8; max-width: 320px; margin-bottom: 24px; font-size: 14px;">The game encountered a problem starting. This often happens if the device is low on memory or the WebView is outdated.</p>
        <div style="background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.2); color: #ef4444; font-size: 10px; padding: 12px; border-radius: 8px; font-family: monospace; overflow-wrap: break-word; max-width: 80vw; margin-bottom: 32px; text-align: left;">
          ${String(err?.message || err)}
        </div>
        <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 16px 32px; border: none; border-radius: 20px; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.1em;">Force Restart</button>
      </div>
    `;
  }
};

// Catch global unhandled errors during boot
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

  // Register Service Worker for PWA updates
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration.scope);
          // Check for updates periodically
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available; force refresh for best experience
                  window.location.reload();
                }
              };
            }
          };
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    });
  }

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
        // Wait a tiny bit for React to actually paint before hiding loader
        requestAnimationFrame(() => {
          setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
          }, 300);
        });
      }
    } catch (err) {
      clearTimeout(safetyTimeout);
      reportFatalError(err);
    }
  }
};

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
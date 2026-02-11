import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

declare global {
  interface Window {
    __BRAINVITA_CLEAR_WATCHDOG?: () => void;
    __APP_READY?: boolean;
  }
}

// Heartbeat: Proof that the JS execution has reached index.tsx
const loaderText = document.getElementById('loader-text');
if (loaderText) {
  loaderText.innerText = "Igniting Engine...";
  loaderText.style.color = "#3b82f6";
}

// Robust error reporting
const reportFatalError = (err: any) => {
  const errMsg = String(err?.message || err);
  console.error('Fatal App Error:', err);

  // If we crash, we MUST show something or it will be a black screen
  const root = document.getElementById('root');
  if (root) {
    // Hide loader if it's still there
    const loader = document.getElementById('initial-loader');
    if (loader) loader.remove();

    root.innerHTML = `
      <div style="background: #020617; color: white; padding: 40px; text-align: center; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; overflow: hidden;">
        <h1 style="font-size: 20px; margin-bottom: 12px; font-weight: 900; color: #f43f5e; letter-spacing: -0.02em; text-transform: uppercase;">CRITICAL ERROR</h1>
        <p style="color: #94a3b8; max-width: 280px; margin-bottom: 24px; font-size: 13px; line-height: 1.5;">The 3D engine failed to start. This usually happens on older devices with limited graphics support.</p>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #64748b; font-size: 9px; padding: 12px; border-radius: 12px; font-family: monospace; max-width: 80vw; margin-bottom: 24px;">
          ${errMsg}
        </div>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 16px 32px; border: none; border-radius: 16px; font-weight: 800; font-size: 11px; text-transform: uppercase; cursor: pointer;">Reboot System</button>
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
      
      // We don't clear the loader here yet. 
      // We wait for App.tsx to signal __APP_READY via a useEffect.
    } catch (err) {
      reportFatalError(err);
    }
  }
};

// Start mounting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
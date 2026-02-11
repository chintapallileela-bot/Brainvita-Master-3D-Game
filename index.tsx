import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

declare global {
  interface Window {
    __BRAINVITA_CLEAR_WATCHDOG?: () => void;
    __APP_READY?: boolean;
  }
}

// Clear the watchdog as early as possible once JS execution starts
if (window.__BRAINVITA_CLEAR_WATCHDOG) {
  window.__APP_READY = true;
  window.__BRAINVITA_CLEAR_WATCHDOG();
}

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
  } catch (err) {
    console.error('Mounting error:', err);
    const errorLog = document.getElementById('boot-error-msg');
    if (errorLog) {
      errorLog.innerText = "Fatal: " + (err instanceof Error ? err.message : String(err));
    }
  }
};

// Ensure mounting happens after DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mountApp();
} else {
  window.addEventListener('load', mountApp);
}
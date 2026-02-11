import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

declare global {
  interface Window {
    __BRAINVITA_CLEAR_WATCHDOG?: () => void;
    __APP_READY?: boolean;
  }
}

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = createRoot(rootElement);
    
    // Set readiness before render to prevent race conditions on fast devices
    window.__APP_READY = true;
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    if (window.__BRAINVITA_CLEAR_WATCHDOG) {
      window.__BRAINVITA_CLEAR_WATCHDOG();
    }
  } catch (err) {
    console.error('Mounting error:', err);
    const errorLog = document.getElementById('boot-error-msg');
    if (errorLog) errorLog.innerText = "Mount Error: " + (err instanceof Error ? err.message : String(err));
  }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mountApp();
} else {
  window.addEventListener('load', mountApp);
}
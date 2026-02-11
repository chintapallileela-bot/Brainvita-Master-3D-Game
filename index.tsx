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
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Explicitly signal readiness to clear the HTML loader
    if (window.__BRAINVITA_CLEAR_WATCHDOG) {
      // Use requestAnimationFrame to ensure the browser has actually started 
      // working on the React tree before hiding the splash
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.__BRAINVITA_CLEAR_WATCHDOG?.();
        }, 100);
      });
    }
  } catch (err) {
    console.error('Mounting error:', err);
    const errorLog = document.getElementById('boot-error-msg');
    if (errorLog) errorLog.innerText = "Mount Error: " + (err instanceof Error ? err.message : String(err));
  }
};

// Handle all ready states for broad mobile browser compatibility
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mountApp();
} else {
  window.addEventListener('load', mountApp);
}
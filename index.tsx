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
    
    window.__APP_READY = true;
    if (window.__BRAINVITA_CLEAR_WATCHDOG) {
      window.__BRAINVITA_CLEAR_WATCHDOG();
    }
  } catch (err) {
    console.error('Mounting error:', err);
  }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mountApp();
} else {
  window.addEventListener('load', mountApp);
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Service Worker Registration
 * We use a root-relative path and check for origin consistency.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Determine the correct path relative to the current location to avoid origin mismatches
    const swPath = new URL('./sw.js', window.location.href).pathname;
    
    navigator.serviceWorker.register(swPath)
      .then((reg) => {
        console.log('SW: Registered successfully. Scope:', reg.scope);
      })
      .catch((err) => {
        // If the registration fails due to origin, we log a specific warning
        if (err.message.includes('origin')) {
          console.warn('SW: Origin mismatch detected. This is common in development previews. Offline features may be limited.');
        } else {
          console.error('SW: Registration failed:', err);
        }
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

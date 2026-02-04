
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Service Worker Registration
 * Using a simple relative path is the most robust way to ensure the origin
 * matches correctly in various sandbox and proxy environments.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Standard relative registration
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('SW: Registered successfully. Scope:', reg.scope);
      })
      .catch((err) => {
        // Log warnings for origin mismatches (common in dev environments)
        if (err.message && err.message.includes('origin')) {
          console.warn('SW: Registration origin issue detected. This is expected in some development previews.');
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

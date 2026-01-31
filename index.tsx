
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Robust Service Worker Registration
 * 
 * Using a simple relative path 'sw.js' is the most reliable way to register
 * a service worker in environments with complex proxying or sub-paths.
 * The browser resolves this against the current page's URL and origin automatically.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((registration) => {
        console.log('SW: Registered successfully with scope:', registration.scope);
      })
      .catch((error) => {
        // Log the error for debugging but don't break the app
        console.warn('SW: Registration failed:', error);
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

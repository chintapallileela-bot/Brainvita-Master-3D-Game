import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// The service worker is now handled automatically by vite-plugin-pwa (configured in vite.config.ts)

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
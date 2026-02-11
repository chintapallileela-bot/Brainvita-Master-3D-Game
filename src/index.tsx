
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Relative to the location of the served HTML file
    navigator.serviceWorker.register('sw.js')
      .then((reg) => console.log('SW: Registered (src)', reg.scope))
      .catch((err) => console.warn('SW: Register failed (src)', err));
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

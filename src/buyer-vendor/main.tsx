import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import '../index.css';

// Registered so the site qualifies as an installable PWA — needed for
// wrapping it as an Android app via PWABuilder/TWA. See public/sw.js for
// why it intentionally does no caching.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Non-fatal: the site still works as a normal website without it,
      // it just won't qualify for "Add to Home Screen" style installs.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import PaystackCallback from '../components/PaystackCallback';
import '../index.css';
import RuntimeErrorBoundary from '../components/RuntimeErrorBoundary';

// Registered so the site qualifies as an installable PWA — needed for
// wrapping it as an Android app via PWABuilder/TWA. See public/sw.js for
// why it intentionally does no caching.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
      // Non-fatal: the app must remain usable even if PWA registration fails.
    });
  });
}

// Recover from stale PWA-controlled bundles without asking users to clear all
// app data (which would sign them out). This only runs once per tab and only
// for the common stale-chunk/module-load failure signatures.
const recoverFromStaleBundle = (message: unknown) => {
  const text = String(message || '');
  if (!/ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(text)) return;
  const recoveryKey = 'tradeease_bundle_recovery_attempted';
  if (sessionStorage.getItem(recoveryKey) === '1') return;
  sessionStorage.setItem(recoveryKey, '1');
  void (async () => {
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations?.();
      await Promise.all((registrations || []).map((registration) => registration.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.toLowerCase().includes('tradeease') || key.toLowerCase().includes('vite')).map((key) => caches.delete(key)));
      }
    } catch { /* best-effort recovery only */ }
    window.location.reload();
  })();
};
window.addEventListener('error', (event) => recoverFromStaleBundle(event.message));
window.addEventListener('unhandledrejection', (event) => recoverFromStaleBundle(event.reason?.message || event.reason));

const isPaystackCallback = window.location.pathname.replace(/\/+$/, '') === '/paystack/callback';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RuntimeErrorBoundary appName="TradeEase">
      {isPaystackCallback ? <PaystackCallback /> : <App />}
    </RuntimeErrorBoundary>
  </StrictMode>,
);

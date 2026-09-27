import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from '../components/AppErrorBoundary';
import '../index.css';

function showBootError(error: unknown) {
  console.error('[TradeEase] Frontend boot error:', error);
  const root = document.getElementById('root');
  if (!root) return;

  const message = error instanceof Error ? error.message : 'Unknown frontend error';
  root.innerHTML = `
    <div style="min-height:100dvh;background:#07130d;color:#f8fafc;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif">
      <div style="width:100%;max-width:460px;text-align:center">
        <div style="font-size:42px;margin-bottom:12px">⚠️</div>
        <h1 style="margin:0 0 10px;font-size:24px">TradeEase could not open</h1>
        <p style="color:#cbd5e1;line-height:1.55">The app failed while loading. Please refresh the page. If the problem continues, the technical detail below can help diagnose the deployment.</p>
        <button onclick="location.reload()" style="border:0;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer;background:#b7f34a;color:#07130d">Reload TradeEase</button>
        <details style="margin-top:18px;text-align:left;color:#94a3b8;font-size:12px"><summary>Technical detail</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${message.replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c] || c))}</pre></details>
      </div>
    </div>`;
}

// Browser-level errors are useful when an exception happens outside React's
// render tree. They also turn a silent white screen into a visible diagnostic.
window.addEventListener('error', (event) => {
  if (event.error) showBootError(event.error);
});
window.addEventListener('unhandledrejection', (event) => showBootError(event.reason));

// Register the service worker defensively. It is deliberately network-only;
// its job is PWA installability, not caching marketplace data.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch((error) => console.warn('[TradeEase] Service worker registration skipped:', error));
  }, { once: true });
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('TradeEase root element was not found.');

  createRoot(rootElement).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  showBootError(error);
}

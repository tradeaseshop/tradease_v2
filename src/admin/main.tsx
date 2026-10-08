import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import '../index.css';
import RuntimeErrorBoundary from '../components/RuntimeErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RuntimeErrorBoundary appName="TradeEase">
      <App />
    </RuntimeErrorBoundary>
  </StrictMode>,
);

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Registro de Service Worker para PWA e instalación Offline en dispositivos móviles y PC
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker Axon PWA listo:', registration.scope);
      })
      .catch((error) => {
        console.warn('Error al registrar Service Worker Axon PWA:', error);
      });
  });
}


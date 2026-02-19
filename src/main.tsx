import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initPWA } from './sw/pwa';

import App from './App';

initPWA();

// Get the root HTML container — throw early to surface misconfigured deploys
const container = document.getElementById('root');
if (!container) {
  throw new Error('[main] #root element not found — check index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);

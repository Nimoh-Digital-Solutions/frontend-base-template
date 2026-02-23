import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initPWA } from './sw/pwa';

// Open Props — CSS custom property primitives (sizes, easing, colours, etc.)
// Loaded here once so all components and styles can access var(--size-*) etc.
import 'open-props/style';

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

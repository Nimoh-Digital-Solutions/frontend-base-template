import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initPWA } from './sw/pwa';
// open-props custom properties are injected at build time by postcss-jit-props
// (see vite.config.ts → css.postcss). Only the vars actually used in CSS/SCSS
// end up in the bundle — no manual import needed here.

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

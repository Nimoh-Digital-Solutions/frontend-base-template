import React, { StrictMode } from 'react';
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

// ---------------------------------------------------------------------------
// @axe-core/react — development-only accessibility audit
// Reports WCAG violations to the browser console as they occur.
// Removed from production bundles by Vite's dead-code elimination because
// the condition is always false when import.meta.env.DEV is false.
// ---------------------------------------------------------------------------
if (import.meta.env.DEV) {
  Promise.all([import('@axe-core/react'), import('react-dom')]).then(
    ([{ default: axe }, ReactDOM]) => {
      axe(React, ReactDOM, 1000);
    },
  );
}

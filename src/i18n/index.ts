/**
 * i18n initialisation
 *
 * Initialises i18next with the `en` locale as the default and only built-in
 * translation.  Additional languages can be registered by adding a new entry
 * to `resources` and a matching JSON file under `./locales/`.
 *
 * The i18n instance is exported so it can be passed directly to
 * `<I18nextProvider i18n={i18n}>` in `App.tsx`.
 *
 * Removing i18n:
 *   Run `yarn setup` and deselect "Internationalisation (i18n)".  The setup
 *   script will delete this directory, revert `App.tsx`, and remove the
 *   `i18next` / `react-i18next` packages from `package.json`.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    // React already escapes values — no need for i18next to double-escape.
    escapeValue: false,
  },
});

export default i18n;

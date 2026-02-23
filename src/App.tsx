import { I18nextProvider } from 'react-i18next';

import { AppRouter } from '@routes';
import { ErrorBoundary } from '@components';
import { ThemeProvider } from '@contexts';
import i18n from './i18n';

import '@nimoh-digital-solutions/tast-ui/style.css';
import './App.scss';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <ThemeProvider>
          <div className="app">
            <AppRouter />
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    </I18nextProvider>
  );
}

export default App;

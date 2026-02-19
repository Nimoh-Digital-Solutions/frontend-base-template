import { AppRouter } from '@routes';

import { ErrorBoundary } from '@components';
import { ThemeProvider } from '@contexts';

import './App.scss';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="app">
          <AppRouter />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional callback for error reporting (e.g. Sentry.captureException). */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary
 *
 * Catches any unhandled render errors in the React tree below it and
 * displays a fallback UI instead of letting the whole page go blank.
 *
 * Pass an `onError` callback to report to Sentry or another service:
 *
 * @example
 * <ErrorBoundary
 *   onError={(error, info) => Sentry.captureException(error, { extra: { componentStack: info.componentStack } })}
 *   fallback={<p>Something went wrong.</p>}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Report to external service via callback
    this.props.onError?.(error, info);

    // Always log to console for development visibility
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Something went wrong</h2>
            <p>Please refresh the page or contact support if the problem persists.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { PATHS } from '@routes/config/paths';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Renders a ProtectedRoute inside a MemoryRouter with a sentinel route at
 * the redirect destination so we can assert which page was landed on.
 */
function renderProtectedRoute({
  isAuthenticated,
  redirectTo,
}: {
  isAuthenticated: boolean;
  redirectTo?: string;
}) {
  const targetPath = redirectTo ?? PATHS.HOME;

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            // Only spread redirectTo when defined; exactOptionalPropertyTypes
            // rejects explicit `undefined` for props typed as `string`.
            redirectTo ? (
              <ProtectedRoute isAuthenticated={isAuthenticated} redirectTo={redirectTo}>
                <p>Protected content</p>
              </ProtectedRoute>
            ) : (
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <p>Protected content</p>
              </ProtectedRoute>
            )
          }
        />
        <Route path={targetPath} element={<p>Redirect destination</p>} />
        <Route path="/custom-login" element={<p>Custom login page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  it('renders children when isAuthenticated is true', () => {
    renderProtectedRoute({ isAuthenticated: true });

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('does not render children when isAuthenticated is false', () => {
    renderProtectedRoute({ isAuthenticated: false });

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects to PATHS.HOME by default when not authenticated', () => {
    renderProtectedRoute({ isAuthenticated: false });

    expect(screen.getByText('Redirect destination')).toBeInTheDocument();
  });

  it('redirects to a custom path when redirectTo is provided and not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute isAuthenticated={false} redirectTo="/custom-login">
                <p>Protected content</p>
              </ProtectedRoute>
            }
          />
          <Route path="/custom-login" element={<p>Custom login page</p>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Custom login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated user even when redirectTo is supplied', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute isAuthenticated={true} redirectTo="/custom-login">
                <p>Authenticated content</p>
              </ProtectedRoute>
            }
          />
          <Route path="/custom-login" element={<p>Custom login page</p>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Authenticated content')).toBeInTheDocument();
    expect(screen.queryByText('Custom login page')).not.toBeInTheDocument();
  });
});

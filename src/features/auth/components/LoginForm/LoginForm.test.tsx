import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { axe } from '../../../../test/a11y.setup';
import { LoginForm } from './LoginForm';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LoginForm', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockClear();
  });

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  it('renders email/username and password fields with labels', () => {
    render(<LoginForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders loading state on submit button', () => {
    render(<LoginForm onSubmit={onSubmit} isLoading />);

    const button = screen.getByRole('button');
    // Button should indicate loading — either via text or aria attribute
    expect(
      button.textContent?.toLowerCase().includes('signing in') ||
        button.getAttribute('aria-busy') === 'true' ||
        button.getAttribute('disabled') !== null,
    ).toBe(true);
  });

  it('renders server error when provided', () => {
    render(<LoginForm onSubmit={onSubmit} serverError="Invalid credentials" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('does not render server error when null', () => {
    render(<LoginForm onSubmit={onSubmit} serverError={null} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  it('shows required error when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email or username is required/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows min-length error for short password', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email or username/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'short');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Successful submission
  // -----------------------------------------------------------------------

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email or username/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      { email_or_username: 'user@example.com', password: 'password123' },
      expect.anything(), // react-hook-form event
    );
  });

  it('does not call onSubmit when isLoading', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} isLoading />);

    await user.type(screen.getByLabelText(/email or username/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    // Button should be disabled during loading
    const button = screen.getByRole('button');
    if (!button.hasAttribute('disabled')) {
      // If not disabled, try clicking — but expect no submission while loading
      await user.click(button);
    }

    // Should not call onSubmit because loading blocks interaction
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Accessibility
  // -----------------------------------------------------------------------

  it('has no axe violations', async () => {
    const { container } = render(<LoginForm onSubmit={onSubmit} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations with server error displayed', async () => {
    const { container } = render(
      <LoginForm onSubmit={onSubmit} serverError="Bad request" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

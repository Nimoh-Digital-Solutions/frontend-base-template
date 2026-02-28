# @nimoh-digital-solutions/tast-ui

Shared React component library for the TAST design system. Ships ready-made, accessible UI primitives styled with SCSS Modules and Open Props tokens.

[![npm](https://img.shields.io/npm/v/@nimoh-digital-solutions/tast-ui)](https://www.npmjs.com/package/@nimoh-digital-solutions/tast-ui)

## Installation

```bash
npm install @nimoh-digital-solutions/tast-ui
# or
yarn add @nimoh-digital-solutions/tast-ui
```

### Peer dependencies

| Package | Version |
|---|---|
| `react` | `^18 \|\| ^19` |
| `react-dom` | `^18 \|\| ^19` |
| `react-router-dom` | `^7` |

## Quick start

```tsx
// 1. Import the stylesheet once (typically in your entry file)
import '@nimoh-digital-solutions/tast-ui/style.css';

// 2. Wrap your app with the ThemeProvider
import { ThemeProvider } from '@nimoh-digital-solutions/tast-ui';

function App() {
  return (
    <ThemeProvider>
      <MyRoutes />
    </ThemeProvider>
  );
}
```

```tsx
// 3. Use components anywhere
import { Button, Card, Badge, Spinner } from '@nimoh-digital-solutions/tast-ui';

function Dashboard() {
  return (
    <Card padding="lg" shadow="md">
      <Badge variant="success">Active</Badge>
      <Button onClick={handleClick}>Save changes</Button>
      {isLoading && <Spinner size="sm" />}
    </Card>
  );
}
```

## Components

### Layout & surfaces

| Component | Description | Key props |
|---|---|---|
| `Card` | Surface container for grouping content | `padding` (`sm` \| `md` \| `lg`), `shadow` (`sm` \| `md` \| `lg` \| `xl`) |
| `Modal` | Dialog overlay with focus trap | `isOpen`, `onClose`, `title` |

### Form controls

| Component | Description | Key props |
|---|---|---|
| `Button` | Primary action element with variants | `variant`, `size`, `disabled`, `isLoading` |
| `Input` | Text input field | `size` (`sm` \| `md` \| `lg`), `error` |
| `Textarea` | Multi-line text input | `rows`, `error` |

### Feedback & status

| Component | Description | Key props |
|---|---|---|
| `Badge` | Status or label indicator | `variant` (`default` \| `success` \| `warning` \| `error` \| `info`), `size` |
| `Spinner` | Loading animation | `size` (`sm` \| `md` \| `lg`) |
| `Toast` | Notification message | `variant` (`success` \| `error` \| `warning` \| `info`), `onDismiss` |
| `Skeleton` | Loading placeholder | `variant` (`text` \| `circular` \| `rectangular` \| `rounded`), `width`, `height` |
| `EmptyState` | Empty data placeholder | `title`, `description`, `icon`, `action` |

### Navigation & data

| Component | Description | Key props |
|---|---|---|
| `Pagination` | Page navigation with ellipsis | `currentPage`, `totalPages`, `onPageChange`, `pageSize` |
| `ProtectedRoute` | Auth guard — renders children or redirects | `children`, `redirectTo` |

### Error handling

| Component | Description | Key props |
|---|---|---|
| `ErrorBoundary` | React error boundary with fallback UI | `onError`, `fallback` |

## Theme system

The library includes a complete light/dark theme system.

```tsx
import { ThemeProvider, useTheme } from '@nimoh-digital-solutions/tast-ui';

function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <Button onClick={toggleTheme}>
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </Button>
  );
}
```

**Available themes:** `light`, `dim`, `dark`

The `ThemeProvider` persists the user's preference to `localStorage` and sets a `data-theme` attribute on `<html>` for CSS-level theming.

### Hooks

| Hook | Returns | Description |
|---|---|---|
| `useTheme()` | `{ theme, toggleTheme, setTheme, isDark, isLight }` | Convenience hook for theme state |
| `useThemeContext()` | Full context value | Raw context consumer |

## TypeScript

All components export their prop interfaces:

```tsx
import type { ButtonProps, CardProps, BadgeVariant } from '@nimoh-digital-solutions/tast-ui';
```

## Development

This package lives in the [TAST monorepo](https://github.com/Nimoh-Digital-Solutions/frontend-base-template). To develop locally:

```bash
# From the monorepo root
yarn storybook        # Launch Storybook for interactive development
yarn packages:build   # Build all packages including tast-ui
```

## License

MIT

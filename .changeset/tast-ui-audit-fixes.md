---
"@nimoh-digital-solutions/tast-ui": minor
---

feat(tast-ui): add EmptyState, Pagination, Skeleton components; fix ErrorBoundary

- New `EmptyState` component with illustration, title, description, and action slots
- New `Pagination` component with page navigation, page-size selector, and a11y support
- New `Skeleton` component with variant shapes (text, circular, rectangular, rounded)
- `ErrorBoundary` updated to use `EmptyState` for fallback rendering
- All components include SCSS Modules, TypeScript interfaces, and barrel exports

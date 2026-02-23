---
'@nimoh-digital-solutions/tast-ui': patch
---

chore: add Storybook for isolated component development

- Install Storybook 10 with @storybook/react-vite builder
- Configure SCSS/PostCSS pipeline (postcss-jit-props + open-props) and @styles alias to match Vite build
- Add theme toolbar decorator for light / dim / dark switching via data-theme attribute
- Add *.stories.tsx for all 8 components: Button, Input, Textarea, Badge, Spinner, Card, Modal, Toast
- Add `storybook` and `storybook:build` scripts to workspace and root package.json

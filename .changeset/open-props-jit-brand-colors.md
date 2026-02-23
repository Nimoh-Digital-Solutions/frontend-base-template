---
"@nimoh-digital-solutions/create-tast-app": minor
"@nimoh-digital-solutions/tast-ui": patch
---

feat(create-tast-app): brand colour prompts during scaffolding

During `npx create-tast-app`, three optional hex colour prompts are now
shown (primary, secondary, tertiary). Providing a hex value generates a
`src/styles/themes/_brand.scss` file with auto-derived light/dark
variants that override the default blue/gray/teal palette for both light
and dark themes. Leaving a prompt blank keeps the template defaults.

fix(tast-ui): postcss-jit-props strips unused Open Props from dist CSS

`postcss-jit-props` is now wired into the tast-ui Vite build config.
Only the Open Props vars actually used by components are emitted
(--ease-3, --size-7, --size-8) — down from ~150 vars to 3.

- Button --sm and --lg min-height migrated to var(--size-7) / var(--size-8)

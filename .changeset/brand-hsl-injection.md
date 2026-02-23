---
"@nimoh-digital-solutions/create-tast-app": patch
---

fix: update injectBrandColors to target new CSS custom property theme system

Brand colour prompts now set `--brand-hue`, `--brand-saturation`,
`--brand-lightness` on `html` (driving the whole light+dark palette)
instead of the old `--color-primary*` mixin tokens. Secondary sets
`--brand-secondary`, tertiary sets `--brand-accent`/`--accent-hue`.

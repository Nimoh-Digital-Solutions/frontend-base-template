---
"@nimoh-digital-solutions/tast-ui": patch
"@nimoh-digital-solutions/tast-hooks": patch
"@nimoh-digital-solutions/create-tast-app": patch
---

fix: resolve workspace: protocol in published dependencies

- tast-ui: change `@nimoh-digital-solutions/tast-utils` from `workspace:^` to `^1.1.0` in runtime `dependencies` — fixes `YN0001: workspace:^` error for any project installing tast-ui
- tast-hooks: same fix for `@nimoh-digital-solutions/tast-utils`
- create-tast-app: banner now shows the actual published version instead of hardcoded v1.0.0
- All packages: add `"tag": "latest"` to publishConfig so the `@latest` dist-tag is always updated on publish

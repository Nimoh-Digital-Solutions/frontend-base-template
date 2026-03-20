---
"@nimoh-digital-solutions/create-tast-app": patch
---

Add `--port-offset <n>` CLI flag

Allows callers (e.g. `create-nimoh-app`) to pre-set the port offset without interactive prompting. When provided, the port offset prompt is skipped and the value is used directly.

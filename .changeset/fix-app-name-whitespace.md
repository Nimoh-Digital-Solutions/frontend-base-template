---
"@nimoh-digital-solutions/create-tast-app": patch
---

Fix APP_NAME whitespace in container names

Wrap `APP_NAME` Makefile variable in `$(strip ...)` to prevent trailing whitespace from producing invalid Docker container names (e.g. `my_app   -fe-dev`). The scaffold now patches existing Makefiles with the same fix.

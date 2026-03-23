---
"@nimoh-digital-solutions/create-nimoh-app": patch
---

fix: pass offset-aware frontend_url to backend CLI config so CORS_ALLOWED_ORIGINS and FRONTEND_URL match the actual FE dev port when a port offset is used

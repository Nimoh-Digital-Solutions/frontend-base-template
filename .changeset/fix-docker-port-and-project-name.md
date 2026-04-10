---
"@nimoh-digital-solutions/create-tast-app": patch
"@nimoh-digital-solutions/create-nimoh-app": patch
---

Fix blank page when FE runs in Docker with port offset: skip Vite port patch when Docker is enabled (container always listens on 3000, Docker maps the host port). Also give FE docker-compose a distinct project name (-fe suffix) to prevent BE docker-down from killing FE containers.

# @nimoh-digital-solutions/create-nimoh-app

## 1.1.0

### Minor Changes

- cd8dcdf: New package: full-stack project scaffolder (Django BE + React FE)
  - `npx @nimoh-digital-solutions/create-nimoh-app` scaffolds a complete project with `backend/` and `frontend/` directories
  - Checks prerequisites (Python ≥3.12, Node ≥18, git)
  - Asks shared values (project name, port offset) once, passes them to both sub-CLIs
  - Creates `.venv` inside `backend/`, installs `nimoh-be-django-base[cli]`, runs `nimoh-base init` interactively
  - Runs `create-tast-app` interactively for the frontend
  - Initialises a single git repo at the project root

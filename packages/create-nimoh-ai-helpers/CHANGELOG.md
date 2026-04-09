# @nimoh-digital-solutions/create-nimoh-ai-helpers

## 0.2.0

### Minor Changes

- 00d64da: New package: CLI to scaffold AI helper assets into any project
  - `npx @nimoh-digital-solutions/create-nimoh-ai-helpers` syncs agents, skills, instructions, prompts, and workflows from the published `@nimoh-digital-solutions/nimoh-ai-helpers` package
  - Defaults to syncing both `.github` and `.claude` directories
  - `--github-only` skips `.claude` sync
  - `--dry-run` previews without writing files

# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets).

## Workflow

1. **After making changes** to any package, run:
   ```bash
   yarn changeset
   ```
   You'll be prompted to select which packages changed and describe the change (patch/minor/major).

2. **Commit the changeset file** alongside your code changes.

3. **Push to `main`** — the Release workflow automatically opens a *"Version Packages"* PR that bumps all affected package versions and updates changelogs.

4. **Merge the PR** — the workflow publishes the new versions to npm automatically.

## Package registry

All packages publish to the public [npm registry](https://www.npmjs.com):
```
https://registry.npmjs.org
```

No authentication is needed to install packages — anyone can use them directly:
```bash
npx @nimoh-digital-solutions/create-tast-app my-app
```

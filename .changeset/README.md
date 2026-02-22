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

4. **Merge the PR** — the workflow publishes the new versions to GitHub Packages automatically.

## Package registry

All packages publish to [GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry):
```
https://npm.pkg.github.com
```

Consumers need an `.npmrc` entry:
```
@nimoh-digital-solutions:registry=https://npm.pkg.github.com
```

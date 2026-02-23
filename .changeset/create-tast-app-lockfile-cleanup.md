---
'@nimoh-digital-solutions/create-tast-app': patch
---

fix(scaffold): delete yarn.lock and packages/ from cloned template

The monorepo `yarn.lock` resolves `@nimoh-digital-solutions/*` packages via
the `workspace:` protocol (e.g. `workspace:^`). Outside the monorepo those
workspace references do not exist, causing `yarn install` to fail immediately:

```
YN0001: Error: @nimoh-digital-solutions/tast-utils@workspace:^: Workspace not found
```

Also removes:
- `packages/` — internal monorepo packages (tast-ui, tast-utils, etc.) that
  have no purpose in a standalone scaffolded app
- `.changeset/` — changeset config and pending changesets belong in the monorepo

These are now deleted in `scaffold.ts` immediately after `.git` removal, so the
fresh `yarn install` generates a proper lockfile from the npm / GitHub Packages
registry.

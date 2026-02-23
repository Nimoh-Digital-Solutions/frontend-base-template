---
'@nimoh-digital-solutions/create-tast-app': patch
---

fix(scaffold): abort instead of warn when run inside a Yarn workspace

The previous `warnIfInsideWorkspace` printed a warning but continued scaffolding.
When `my-app` is created inside a monorepo (e.g. the user ran `npx create-tast-app`
from inside `tast-fe-app`), Yarn walks up the directory tree, finds the workspace
root, and resolves `@nimoh-digital-solutions/*` packages from the local `packages/`
tree instead of the registry. Those packages use `workspace:^` to reference each
other, causing `yarn install` to fail with:

```
YN0001: Error: @nimoh-digital-solutions/tast-utils@workspace:^: Workspace not found
```

This happens even after manually deleting `yarn.lock` and `packages/` from the
scaffolded app, because Yarn re-discovers the parent workspace on every run.

**Fix:** `abortIfInsideWorkspace()` — exits with code 1 and prints a clear error
message telling the user to run the command from outside the monorepo, with an
exact example command they can copy-paste.

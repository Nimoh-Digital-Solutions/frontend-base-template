---
'@nimoh-digital-solutions/create-tast-app': patch
---

fix(scaffold): use workspaces:[] to stop Yarn traversing into parent monorepo

Yarn 4 finds a workspace root by walking UP the directory tree. When the
scaffolded app is created inside a monorepo (e.g. the user forgot to `cd` out
of `tast-fe-app` first), Yarn found the monorepo root, then resolved
`@nimoh-digital-solutions/*` from the local `packages/` tree, which contains
`workspace:^` cross-references that don't exist outside the monorepo:

```
YN0001: @nimoh-digital-solutions/tast-utils@workspace:^: Workspace not found
```

This happened even after `yarn.lock` and `packages/` were deleted from the
scaffolded app, because Yarn walked up and used the PARENT workspace's
`yarn.lock` at `tast-fe-app/yarn.lock`.

**Fix:** Set `"workspaces": []` in the scaffolded `package.json` instead of
deleting the field. Yarn treats any `package.json` with a `workspaces` field
as a workspace root. An EMPTY array means "I am a root with no packages" —
Yarn stops traversal here and installs all deps from the registry.

Also:
- Strip any `workspace:` protocol from deps (defensive, in case any slip in)
- Remove `storybook` / `storybook:build` scripts (reference tast-ui workspace)

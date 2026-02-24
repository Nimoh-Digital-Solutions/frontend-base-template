---
"@nimoh-digital-solutions/create-tast-app": patch
---

fix(install): run `corepack enable` before `yarn install`

On machines where Corepack has never been activated, the global Yarn is still
1.x which fails with "current global version of Yarn is 1.22.22". Running
`corepack enable` silently before the install step activates Yarn 4 via the
`packageManager` field in package.json, so the scaffold works out of the box
on fresh machines.

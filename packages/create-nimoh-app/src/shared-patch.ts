import path from 'path';
import { exists, logOk, logStep, logWarn, readText, writeText } from './utils.js';

/**
 * After both FE and mobile are scaffolded, verify and patch cross-platform
 * references so `packages/shared/` is consumable from both.
 *
 * Key patches:
 * 1. Re-add `COPY packages/shared/` to FE Dockerfile (create-tast-app strips it)
 * 2. Verify FE tsconfig/vite @shared aliases exist (should be from template)
 * 3. Verify mobile tsconfig/babel/metro @shared paths are monorepo-relative
 */
export function patchSharedReferences(projectRoot: string): void {
  logStep('Patching shared package references');

  patchFrontendDockerfile(projectRoot);
  verifyFrontendSharedAlias(projectRoot);
  verifyMobileSharedPaths(projectRoot);
}

// ─── 1. Frontend Dockerfile ─────────────────────────────────────────────────

/**
 * create-tast-app's `patchDockerfileForScaffold` removes `COPY packages/ packages/`
 * from the Dockerfile because standalone FE projects don't have `packages/`.
 * When `--mobile` is active `packages/shared/` exists, so we re-add a targeted
 * COPY for it right after the dependency manifest copies.
 */
function patchFrontendDockerfile(projectRoot: string): void {
  const dockerfilePath = path.join(projectRoot, 'frontend', 'Dockerfile');
  if (!exists(dockerfilePath)) {
    logWarn('Frontend Dockerfile not found — skipping Docker patch');
    return;
  }

  let content = readText(dockerfilePath);

  // Already patched (idempotent)
  if (content.includes('COPY packages/shared/')) {
    logOk('Dockerfile — packages/shared/ COPY already present');
    return;
  }

  // Insert `COPY packages/shared/ packages/shared/` right after the
  // `COPY package.json yarn.lock .yarnrc.yml ./` line.
  const manifestCopyPattern = /^(COPY package\.json yarn\.lock \.yarnrc\.yml \.\/\n)/m;

  if (manifestCopyPattern.test(content)) {
    content = content.replace(
      manifestCopyPattern,
      '$1COPY packages/shared/ packages/shared/\n',
    );

    // Update the comment to mention shared packages
    content = content.replace(
      /# Root manifests and lockfile are copied first so `yarn install` is only\n# re-run when dependencies change, not on every source file change\.\n/,
      '# Root manifests, lockfile, and shared packages are copied first so\n# `yarn install` is only re-run when dependencies change.\n',
    );

    writeText(dockerfilePath, content);
    logOk('Dockerfile — added COPY packages/shared/ for Docker builds');
  } else {
    logWarn('Dockerfile — could not locate manifest COPY line; patch skipped');
  }
}

// ─── 2. Frontend @shared alias verification ─────────────────────────────────

function verifyFrontendSharedAlias(projectRoot: string): void {
  const tsconfigPath = path.join(projectRoot, 'frontend', 'tsconfig.json');
  if (!exists(tsconfigPath)) return;

  const content = readText(tsconfigPath);
  if (content.includes('@shared/*')) {
    logOk('Frontend tsconfig.json — @shared/* alias present');
  } else {
    logWarn('Frontend tsconfig.json — @shared/* alias not found; FE may not resolve shared types');
  }

  const vitePath = path.join(projectRoot, 'frontend', 'vite.config.ts');
  if (exists(vitePath)) {
    const viteContent = readText(vitePath);
    if (viteContent.includes('@shared')) {
      logOk('Frontend vite.config.ts — @shared alias present');
    } else {
      logWarn('Frontend vite.config.ts — @shared alias not found');
    }
  }
}

// ─── 3. Mobile @shared path verification ─────────────────────────────────────

function verifyMobileSharedPaths(projectRoot: string): void {
  const mobileDir = path.join(projectRoot, 'mobile');
  if (!exists(mobileDir)) return;

  const tsconfigPath = path.join(mobileDir, 'tsconfig.json');
  if (exists(tsconfigPath)) {
    const content = readText(tsconfigPath);
    if (content.includes('../packages/shared')) {
      logOk('Mobile tsconfig.json — @shared/* points to ../packages/shared');
    } else {
      logWarn('Mobile tsconfig.json — @shared/* path may not be correct');
    }
  }

  const babelPath = path.join(mobileDir, 'babel.config.js');
  if (exists(babelPath)) {
    const content = readText(babelPath);
    if (content.includes('../packages/shared')) {
      logOk('Mobile babel.config.js — @shared alias points to ../packages/shared');
    } else {
      logWarn('Mobile babel.config.js — @shared alias may not be correct');
    }
  }

  const metroPath = path.join(mobileDir, 'metro.config.js');
  if (exists(metroPath)) {
    const content = readText(metroPath);
    if (content.includes("'..', 'packages', 'shared'") || content.includes("'..', 'packages'")) {
      logOk('Mobile metro.config.js — watchFolders includes ../packages/shared');
    } else {
      logWarn('Mobile metro.config.js — watchFolders may not include shared package');
    }
  }
}

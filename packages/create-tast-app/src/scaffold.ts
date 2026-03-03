import path from 'path';
import { createSpinner } from './spinner.js';
import {
  commandExists,
  exec,
  execAsync,
  exists,
  logInfo,
  logOk,
  logStep,
  readJson,
  readText,
  removeMarkedSection,
  safeRmDir,
  safeUnlink,
  toPackageName,
  toTitle,
  writeJson,
  writeText,
} from './utils.js';

const TEMPLATE_REPO = 'https://github.com/Nimoh-Digital-Solutions/frontend-base-template.git';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScaffoldOptions {
  /** Final directory name (and package name) for the new app */
  appName: string;
  /** Human-readable short description */
  description: string;
  /** Absolute path to create the project in */
  destDir: string;
  enableTailwind: boolean;
  enablePwa: boolean;
  enableDocker: boolean;
  enableHusky: boolean;
  /**
   * Optional brand hex colours, e.g. '#3b82f6'.
   * When provided, a `_brand.scss` override file is generated in
   * `src/styles/themes/` that sets `--color-primary*` etc. to the
   * supplied values (with auto-derived light/dark stops).
   * Leave undefined to keep the template default palette.
   */
  brandPrimary?: string;
  brandSecondary?: string;
  brandTertiary?: string;
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const { appName, description, destDir, enableTailwind, enablePwa, enableDocker, enableHusky } = opts;

  if (exists(destDir)) {
    throw new Error(`Directory "${path.basename(destDir)}" already exists.`);
  }

  try {
    await scaffoldInner(opts);
  } catch (err) {
    // Rollback: remove the partially-created directory so users don't end up
    // with a broken project they need to clean up manually.
    if (exists(destDir)) {
      logStep('Rolling back — removing partially-created directory');
      safeRmDir(destDir);
      logOk('Rollback complete');
    }
    throw err;
  }
}

async function scaffoldInner(opts: ScaffoldOptions): Promise<void> {
  const { appName, description, destDir, enableTailwind, enablePwa, enableDocker, enableHusky } = opts;

  // 1. Clone template
  await cloneTemplate(destDir);

  // 2. Strip git history (fresh start)
  safeRmDir(path.join(destDir, '.git'));
  logOk('Removed .git history — clean slate');

  // 2.5 Remove monorepo-only artifacts that must not exist in a standalone app.
  //   - yarn.lock: the monorepo lockfile resolves @nimoh-digital-solutions/*
  //     packages via the workspace: protocol (e.g. workspace:^). Outside the
  //     monorepo those workspace references don't exist, causing Yarn to fail with
  //     "Workspace not found". Deleting it forces Yarn to generate a fresh
  //     lockfile from the npm registry.
  //   - packages/: internal monorepo packages (tast-ui, tast-utils, etc.)
  //   - .changeset/: changeset config and pending changesets
  safeUnlink(path.join(destDir, 'yarn.lock'));
  safeRmDir(path.join(destDir, 'packages'));
  safeRmDir(path.join(destDir, '.changeset'));

  // 3. Token replace + cleanup monorepo references
  logStep('Customising template');
  replaceTokens(destDir, appName, description);
  cleanTsconfigWorkspacePaths(destDir);
  injectBrandColors(destDir, opts);

  // 3.5 Generate .env.local from .env.example with the app title pre-filled
  generateEnvLocal(destDir, appName);

  // 4. Optional feature removal
  if (!enableDocker) {
    logStep('Removing Docker configuration');
    removeDocker(destDir);
  } else {
    // Patch the Dockerfile for a standalone (non-monorepo) project.
    // The template Dockerfile has a `COPY packages/ packages/` line needed for
    // the monorepo workspace install. Scaffolded projects don't have a packages/
    // directory and would fail the Docker build without this patch.
    patchDockerfileForScaffold(destDir);
  }

  if (!enablePwa) {
    logStep('Removing PWA support');
    removePwa(destDir);
  }

  if (!enableHusky) {
    logStep('Removing Husky git hooks');
    removeHusky(destDir);
  }

  // 5. Remove setup scripts that are no longer needed
  cleanupSetupScripts(destDir, { enablePwa, enableDocker, enableHusky });

  // 6. Optional Tailwind CSS v4 integration
  if (enableTailwind) {
    logStep('Adding Tailwind CSS v4');
    addTailwind(destDir);
  }

  // 7. Remove template-only docs that are not relevant to a scaffolded app
  cleanupTemplateDocs(destDir);

  // 8. Initialise a fresh git repo + initial commit
  initGitRepo(destDir, appName);
}

// ─── Clone ───────────────────────────────────────────────────────────────────

async function cloneTemplate(destDir: string): Promise<void> {
  // Pre-flight: verify git is available
  if (!commandExists('git')) {
    throw new Error(
      'git is not installed or not on PATH.\n' +
      '  Install git: https://git-scm.com/downloads\n' +
      '  Then re-run create-tast-app.'
    );
  }

  const spinner = createSpinner('Cloning template…');

  const result = await execAsync(
    `git clone --depth 1 ${TEMPLATE_REPO} "${path.basename(destDir)}"`,
    path.dirname(destDir),
  );

  if (!result.success) {
    spinner.fail('Clone failed');
    throw new Error(`Failed to clone template: ${result.error ?? 'unknown error'}`);
  }

  spinner.succeed('Template cloned');
}

// ─── Token replacement ───────────────────────────────────────────────────────

const TEMPLATE_TITLE = 'React Starter Kit';
const TEMPLATE_DESCRIPTION =
  'A modern React starter kit with TypeScript, Vite, SCSS, and comprehensive tooling for building scalable applications';

function replaceTokens(destDir: string, appName: string, description: string): void {
  const pkgName = toPackageName(appName);
  const appTitle = toTitle(appName);

  // package.json
  const pkgPath = path.join(destDir, 'package.json');
  if (exists(pkgPath)) {
    const pkg = readJson(pkgPath);
    pkg['name'] = pkgName;
    pkg['description'] = description || `${appTitle} — built with TAST`;
    // Remove the "private" field if publishing; keep it if not
    // Optionally init version to 0.1.0
    pkg['version'] = '0.1.0';

    // Set workspaces to an EMPTY array rather than deleting the field.
    //
    // Yarn 4 finds the nearest workspace root by walking UP the directory tree.
    // If the scaffolded app is accidentally created inside a monorepo (e.g.
    // tast-fe-app), deleting the workspaces field means Yarn keeps walking up,
    // finds the monorepo root, then resolves @nimoh-digital-solutions/* from the
    // local packages/ symlinks which contain workspace:^ cross-references that
    // don't exist outside the monorepo.
    //
    // An EMPTY workspaces array signals "I am a workspace root with no members".
    // Yarn stops traversal here and installs everything from the registry.
    pkg['workspaces'] = [];

    // Strip workspace: protocol from any dependency that slipped in — replace
    // with a bare ^ range Yarn can resolve from the registry.
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const deps = pkg[section] as Record<string, string> | undefined;
      if (deps) {
        for (const [name, version] of Object.entries(deps)) {
          if (typeof version === 'string' && version.startsWith('workspace:')) {
            // workspace:^  → ^0.0.0 (resolve latest compatible from registry)
            // workspace:*  → *
            // workspace:~1.0.0 → ~1.0.0
            const bare = version.replace(/^workspace:/, '') || '*';
            deps[name] = bare === '^' ? '*' : bare;
          }
        }
      }
    }

    const scripts = pkg['scripts'] as Record<string, string> | undefined;
    if (scripts) {
      delete scripts['packages:build'];
      delete scripts['packages:typecheck'];
      delete scripts['changeset'];
      delete scripts['changeset:version'];
      delete scripts['changeset:publish'];
      // Storybook scripts reference `yarn workspace @nimoh-digital-solutions/tast-ui`
      // which doesn't exist in a standalone app.
      delete scripts['storybook'];
      delete scripts['storybook:build'];
    }

    const devDeps = pkg['devDependencies'] as Record<string, string> | undefined;
    if (devDeps) {
      delete devDeps['@changesets/cli'];
      delete devDeps['prompts'];
      delete devDeps['@types/prompts'];
    }

    writeJson(pkgPath, pkg);
    logOk('package.json — name, description, version, stripped monorepo fields');
  }

  // index.html — title + meta tags
  const indexPath = path.join(destDir, 'index.html');
  if (exists(indexPath)) {
    let html = readText(indexPath);
    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${appTitle}</title>`
    );
    html = html.replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${description || `${appTitle} — built with TAST`}$2`
    );
    html = html.replace(
      /(<meta\s+name="application-name"\s+content=")[^"]*(")/,
      `$1${appTitle}$2`
    );
    writeText(indexPath, html);
    logOk('index.html — title, meta description, application-name');
  }

  // src/configs/appConfig.ts — default app name fallback
  const configPath = path.join(destDir, 'src', 'configs', 'appConfig.ts');
  if (exists(configPath)) {
    let cfg = readText(configPath);
    cfg = cfg.replace(
      new RegExp(`'${TEMPLATE_TITLE}'`, 'g'),
      `'${appTitle}'`
    );
    writeText(configPath, cfg);
    logOk('src/configs/appConfig.ts — default title');
  }

  // README.md — first heading
  const readmePath = path.join(destDir, 'README.md');
  if (exists(readmePath)) {
    let readme = readText(readmePath);
    readme = readme.replace(
      new RegExp(`# ${TEMPLATE_TITLE}`, 'g'),
      `# ${appTitle}`
    );
    readme = readme.replace(
      new RegExp(TEMPLATE_DESCRIPTION, 'g'),
      description || `${appTitle} — built with TAST`
    );
    writeText(readmePath, readme);
    logOk('README.md — heading');
  }

  // public/manifest.webmanifest
  const manifestPath = path.join(destDir, 'public', 'manifest.webmanifest');
  if (exists(manifestPath)) {
    let manifest = readText(manifestPath);
    manifest = manifest.replace(
      new RegExp(TEMPLATE_TITLE, 'g'),
      appTitle
    );
    writeText(manifestPath, manifest);
    logOk('manifest.webmanifest — name');
  }
}

// ─── tsconfig.json — strip workspace-specific paths ──────────────────────────

/**
 * Remove `@nimoh-digital-solutions/*` path entries from `tsconfig.json`.
 *
 * The monorepo template maps `@nimoh-digital-solutions/tast-utils` etc. to
 * `../packages/<pkg>/src/index.ts` so TypeScript resolves to source in the
 * workspace. In a standalone scaffolded app, `packages/` doesn't exist — the
 * packages come from the npm registry and resolve via `node_modules/`.
 * Leaving the stale paths causes TypeScript errors.
 */
function cleanTsconfigWorkspacePaths(destDir: string): void {
  const tsconfigPath = path.join(destDir, 'tsconfig.json');
  if (!exists(tsconfigPath)) return;

  let content = readText(tsconfigPath);

  // Remove lines that map @nimoh-digital-solutions/* to ../packages/*
  // Matches both the key and key/* wildcard forms, with or without trailing comma.
  content = content.replace(
    /^\s*"@nimoh-digital-solutions\/[^"]*":\s*\[[^\]]*\],?\s*\n/gm,
    ''
  );

  // Remove the "Workspace package resolution" comment if present
  content = content.replace(
    /^\s*\/\/\s*Workspace package resolution[^\n]*\n/gm,
    ''
  );

  // Clean up trailing commas before closing brace of "paths" block
  content = content.replace(/,(\s*\n\s*\})/g, '$1');

  // Clean up double blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  writeText(tsconfigPath, content);
  logOk('tsconfig.json — removed workspace package path mappings');
}

// ─── Docker patch for standalone (non-monorepo) projects ────────────────────

/**
 * Removes the `COPY packages/ packages/` line from the Dockerfile.
 *
 * The template is a workspace monorepo and Yarn needs every package.json from
 * `packages/` to resolve `workspace:` protocol entries in the lockfile.
 * Scaffolded projects are NOT monorepos — they install everything from npm, so
 * `packages/` doesn’t exist and the COPY would fail the production Docker build.
 */
function patchDockerfileForScaffold(destDir: string): void {
  const dockerfilePath = path.join(destDir, 'Dockerfile');
  if (!exists(dockerfilePath)) return;

  let content = readText(dockerfilePath);

  // Remove the `COPY packages/ packages/` line.
  content = content.replace(/^COPY packages\/ packages\/\n?/m, '');

  // Trim the now-inaccurate part of the layer-caching comment that mentions
  // workspace package.json files (no longer relevant in a standalone project).
  content = content.replace(
    /# Root manifests \+ lockfile \+ every workspace package\.json are needed so Yarn\n# can resolve the workspace: protocol entries in the lockfile\.\n/,
    '# Root manifests and lockfile are copied first so `yarn install` is only\n# re-run when dependencies change, not on every source file change.\n',
  );

  content = content.replace(/\n{3,}/g, '\n\n');
  writeText(dockerfilePath, content);
  logOk('Dockerfile \u2014 removed monorepo workspace COPY (standalone project)');
}

// ─── Docker removal ──────────────────────────────────────────────────────────

function removeDocker(destDir: string): void {
  const files = ['Dockerfile', 'docker-compose.yml', '.dockerignore', 'nginx.conf'];
  let deleted = 0;

  for (const f of files) {
    if (safeUnlink(path.join(destDir, f))) deleted++;
  }

  // Remove nginx/ directory (contains security_headers.conf etc.)
  if (safeRmDir(path.join(destDir, 'nginx'))) {
    deleted++;
    logInfo('nginx/ — removed');
  }

  // Remove Makefile (Docker-specific make targets)
  if (safeUnlink(path.join(destDir, 'Makefile'))) {
    deleted++;
    logInfo('Makefile — removed');
  }

  // README — remove Docker sections
  const readmePath = path.join(destDir, 'README.md');
  if (exists(readmePath)) {
    let readme = readText(readmePath);
    readme = removeMarkedSection(readme, 'DOCKER');
    readme = readme.replace(/^\s*-\s+\*\*Docker\*\*[^\n]*\n/gm, '');
    readme = readme.replace(/^\s*yarn setup:docker\s*\n/gm, '');
    readme = readme.replace(/\n{3,}/g, '\n\n');
    writeText(readmePath, readme);
    logInfo('README.md — removed Docker sections');
  }

  // .env.example — remove Docker section
  const envExPath = path.join(destDir, '.env.example');
  if (exists(envExPath)) {
    let env = readText(envExPath);
    env = env.replace(/# -{5,}\s*\n# 🐳 Docker[^#]*/g, '');
    env = env.replace(/\n{3,}/g, '\n\n');
    writeText(envExPath, env);
    logInfo('.env.example — removed Docker section');
  }

  // package.json — remove setup:docker script
  removePkgScript(destDir, 'setup:docker');

  logOk(`Deleted ${deleted} Docker file(s)`);
}

// ─── PWA removal ─────────────────────────────────────────────────────────────

const PWA_FILES = [
  'plugins/pwa.ts',
  'plugins/html-transform.ts',
  'src/sw/pwa.ts',
  'src/types/pwa.ts',
  'src/utils/pwa.ts',
  'src/utils/pwa.test.ts',
  'public/manifest.webmanifest',
];

function removePwa(destDir: string): void {
  let deleted = 0;

  // Remove PWA source files
  for (const f of PWA_FILES) {
    if (safeUnlink(path.join(destDir, f))) deleted++;
  }

  // Remove icons directory (PWA-specific)
  if (safeRmDir(path.join(destDir, 'public', 'icons'))) deleted++;

  // Remove src/sw directory if empty (or force)
  safeRmDir(path.join(destDir, 'src', 'sw'));

  // Remove src/pwa directory if it exists
  safeRmDir(path.join(destDir, 'src', 'pwa'));

  // package.json — remove vite-plugin-pwa dep + setup script
  removePwaFromPackageJson(destDir);

  // plugins/index.ts — remove pwa + html-transform exports
  removePwaFromPluginsIndex(destDir);

  // vite.config.ts — remove pwa plugin usage
  removePwaFromViteConfig(destDir);

  // index.html — remove manifest link + PWA meta tags
  removePwaFromIndexHtml(destDir);

  // README — remove PWA sections
  const readmePath = path.join(destDir, 'README.md');
  if (exists(readmePath)) {
    let readme = readText(readmePath);
    readme = removeMarkedSection(readme, 'PWA');
    readme = readme.replace(/^\s*-\s+\*\*PWA\*\*[^\n]*\n/gm, '');
    readme = readme.replace(/^\s*yarn setup:pwa\s*\n/gm, '');
    readme = readme.replace(/\n{3,}/g, '\n\n');
    writeText(readmePath, readme);
    logInfo('README.md — removed PWA sections');
  }

  // main.tsx — remove initPWA import and call
  removePwaFromMainTsx(destDir);

  // App.tsx — remove PwaUpdateBanner import and render
  removePwaFromAppTsx(destDir);

  logOk(`Deleted ${deleted} PWA file(s)`);
}

function removePwaFromPackageJson(destDir: string): void {
  const pkgPath = path.join(destDir, 'package.json');
  if (!exists(pkgPath)) return;

  const pkg = readJson(pkgPath);
  let changed = false;

  const devDeps = pkg['devDependencies'] as Record<string, string> | undefined;
  if (devDeps?.['vite-plugin-pwa']) {
    delete devDeps['vite-plugin-pwa'];
    changed = true;
  }
  const deps = pkg['dependencies'] as Record<string, string> | undefined;
  if (deps?.['vite-plugin-pwa']) {
    delete deps['vite-plugin-pwa'];
    changed = true;
  }

  if (changed) {
    writeJson(pkgPath, pkg);
    logInfo('package.json — removed vite-plugin-pwa');
  }

  removePkgScript(destDir, 'setup:pwa');
}

function removePwaFromPluginsIndex(destDir: string): void {
  const indexPath = path.join(destDir, 'plugins', 'index.ts');
  if (!exists(indexPath)) return;

  let content = readText(indexPath);
  // Remove pwa and html-transform re-exports / imports
  content = content.replace(/^.*pwaPlugin.*\n/gm, '');
  content = content.replace(/^.*htmlTransformPlugin.*\n/gm, '');
  content = content.replace(/^.*pwa.*\n/gim, '');
  content = content.replace(/^.*html-transform.*\n/gim, '');
  content = content.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  writeText(indexPath, content);
  logInfo('plugins/index.ts — removed PWA plugin exports');
}

function removePwaFromViteConfig(destDir: string): void {
  const configPath = path.join(destDir, 'vite.config.ts');
  if (!exists(configPath)) return;

  let content = readText(configPath);

  // Remove pwa plugin import from './plugins'
  content = content.replace(
    /import\s*\{[^}]*(?:pwaPlugin|htmlTransformPlugin)[^}]*\}\s*from\s*['"]\.\/plugins['"];\n?/g,
    ''
  );

  // Remove enableDevPwa variable
  content = content.replace(/\n[ \t]*const enableDevPwa[^\n]+\n/g, '\n');

  // Remove PWA strategy comment block
  content = content.replace(/\n[ \t]*\/\*\*\s*\n[ \t]*\* PWA strategy:[\s\S]*?\*\/\n/g, '\n');

  // Remove pwaPlugin call (with optional comment above it)
  content = content.replace(/\n[ \t]*\/\/ PWA always[^\n]*\n[ \t]*pwaPlugin\([^)]*\),?/g, '');
  content = content.replace(/\n[ \t]*pwaPlugin\([^)]*\),?/g, '');

  // Remove htmlTransformPlugin call (with optional comment above it)
  content = content.replace(
    /\n[ \t]*\/\/ Remove PWA[^\n]*\n[ \t]*htmlTransformPlugin\([^)]*\),?/g,
    ''
  );
  content = content.replace(/\n[ \t]*htmlTransformPlugin\([^)]*\),?/g, '');

  // Clean up double blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  writeText(configPath, content);
  logInfo('vite.config.ts — removed PWA plugin usage');
}

function removePwaFromIndexHtml(destDir: string): void {
  const indexPath = path.join(destDir, 'index.html');
  if (!exists(indexPath)) return;

  let html = readText(indexPath);

  // Remove manifest link
  html = html.replace(/\s*<link rel="manifest"[^>]*>\s*/g, '\n    ');

  // Remove PWA meta tags block
  html = html.replace(
    /\s*<!-- PWA capabilities -->\s*\n[\s\S]*?<!-- Additional PWA meta tags -->\s*\n.*msapplication-TileColor.*\n/g,
    '\n'
  );

  // Remove apple-touch-icon link
  html = html.replace(/\s*<link rel="apple-touch-icon"[^>]*>\s*/g, '\n    ');

  // Remove mobile-web-app-capable meta
  html = html.replace(/\s*<meta name="mobile-web-app-capable"[^>]*>\s*/g, '\n    ');
  html = html.replace(/\s*<meta name="apple-mobile-web-app-status-bar-style"[^>]*>\s*/g, '\n    ');
  html = html.replace(/\s*<meta name="application-name"[^>]*>\s*/g, '\n    ');
  html = html.replace(/\s*<meta name="msapplication-TileColor"[^>]*>\s*/g, '\n    ');

  // Clean up multiple blank lines inside <head>
  html = html.replace(/(\n[ \t]*){3,}/g, '\n\n');

  writeText(indexPath, html);
  logInfo('index.html — removed PWA meta tags and manifest link');
}

/**
 * Remove `initPWA` import and call from `src/main.tsx`.
 *
 * When PWA is disabled, `src/sw/pwa.ts` is deleted. If `main.tsx` still
 * imports `initPWA` from that module the build breaks with a missing-module
 * error.
 */
function removePwaFromMainTsx(destDir: string): void {
  const mainPath = path.join(destDir, 'src', 'main.tsx');
  if (!exists(mainPath)) return;

  let content = readText(mainPath);

  // Remove the import line:  import { initPWA } from './sw/pwa';
  content = content.replace(/^import\s*\{[^}]*initPWA[^}]*\}\s*from\s*['"][^'"]*pwa['"];\s*\n/gm, '');

  // Remove the initPWA() call (with optional surrounding blank lines)
  content = content.replace(/^\s*initPWA\(\);\s*\n/gm, '');

  // Clean up double blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  writeText(mainPath, content);
  logInfo('src/main.tsx — removed initPWA import and call');
}

/**
 * Remove `PwaUpdateBanner` import and JSX render from `src/App.tsx`.
 *
 * When PWA is disabled, the component still works (it's in @components) but
 * renders nothing useful — cleaner to strip it so new developers aren't
 * confused by a dormant PWA banner.
 */
function removePwaFromAppTsx(destDir: string): void {
  const appPath = path.join(destDir, 'src', 'App.tsx');
  if (!exists(appPath)) return;

  let content = readText(appPath);

  // Remove PwaUpdateBanner from a destructured import like:
  //   import { ErrorBoundary, PwaUpdateBanner } from '@components';
  // Handle it being first, middle, or last in the list.
  content = content.replace(/,\s*PwaUpdateBanner\b/g, '');
  content = content.replace(/\bPwaUpdateBanner\s*,\s*/g, '');

  // Remove <PwaUpdateBanner /> JSX line
  content = content.replace(/^\s*<PwaUpdateBanner\s*\/?>.*\n/gm, '');

  // Clean up double blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  writeText(appPath, content);
  logInfo('src/App.tsx — removed PwaUpdateBanner');
}

// ─── Husky removal ────────────────────────────────────────────────────────────

function removeHusky(destDir: string): void {
  // Remove .husky directory
  const huskyDir = path.join(destDir, '.husky');
  if (safeRmDir(huskyDir)) {
    logInfo('.husky/ — removed');
  }

  // package.json — remove prepare script, lint-staged config + dep
  const pkgPath = path.join(destDir, 'package.json');
  if (exists(pkgPath)) {
    const pkg = readJson(pkgPath);
    let changed = false;

    const scripts = pkg['scripts'] as Record<string, string> | undefined;
    if (scripts?.['prepare']) {
      const huskyPrepare = scripts['prepare'].includes('husky');
      if (huskyPrepare) {
        delete scripts['prepare'];
        changed = true;
      }
    }

    const devDeps = pkg['devDependencies'] as Record<string, string> | undefined;
    if (devDeps?.['husky']) {
      delete devDeps['husky'];
      changed = true;
    }
    if (devDeps?.['lint-staged']) {
      delete devDeps['lint-staged'];
      changed = true;
    }

    if (pkg['lint-staged']) {
      delete pkg['lint-staged'];
      changed = true;
    }

    if (changed) {
      writeJson(pkgPath, pkg);
      logInfo('package.json — removed husky, lint-staged, prepare script');
    }
  }

  removePkgScript(destDir, 'setup:husky');
  logOk('Husky configuration removed');
}

// ─── Tailwind CSS v4 integration ──────────────────────────────────────────────

/**
 * Add Tailwind CSS v4 to the scaffolded project.
 *
 * Tailwind runs **alongside** the existing SCSS Modules setup — it does NOT
 * replace it.  Components keep their `.module.scss` files for scoped styles,
 * and Tailwind utility classes are available everywhere via a CSS import.
 *
 * What this function does:
 *  1. Adds `tailwindcss` + `@tailwindcss/vite` to devDependencies.
 *  2. Injects the `@tailwindcss/vite` plugin into `vite.config.ts`.
 *  3. Creates `src/styles/tailwind.css` with `@import "tailwindcss"` and
 *     a `@theme` block that bridges the project's Open Props design tokens
 *     so the Tailwind palette and spacing scales are in sync with the SCSS
 *     token system.
 *  4. Imports `tailwind.css` in `src/main.tsx`.
 */
function addTailwind(destDir: string): void {
  addTailwindDeps(destDir);
  addTailwindVitePlugin(destDir);
  createTailwindCss(destDir);
  importTailwindInMain(destDir);
}

/** 1. Add tailwindcss + @tailwindcss/vite to devDependencies */
function addTailwindDeps(destDir: string): void {
  const pkgPath = path.join(destDir, 'package.json');
  if (!exists(pkgPath)) return;

  const pkg = readJson(pkgPath);
  const devDeps = (pkg['devDependencies'] ?? {}) as Record<string, string>;
  devDeps['tailwindcss'] = '^4';
  devDeps['@tailwindcss/vite'] = '^4';
  pkg['devDependencies'] = devDeps;
  writeJson(pkgPath, pkg);
  logOk('package.json — added tailwindcss + @tailwindcss/vite');
}

/** 2. Inject @tailwindcss/vite plugin into vite.config.ts */
function addTailwindVitePlugin(destDir: string): void {
  const configPath = path.join(destDir, 'vite.config.ts');
  if (!exists(configPath)) return;

  let content = readText(configPath);

  // Add the import — insert after the last existing import
  if (!content.includes('@tailwindcss/vite')) {
    // Find the last import line and append after it
    const importRegex = /^import .+;\s*$/gm;
    let lastImportEnd = 0;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportEnd = match.index + match[0].length;
    }

    if (lastImportEnd > 0) {
      content =
        content.slice(0, lastImportEnd) +
        "\nimport tailwindcss from '@tailwindcss/vite';" +
        content.slice(lastImportEnd);
    }
  }

  // Add the plugin call right after react() in the plugins array
  if (!content.includes('tailwindcss()')) {
    content = content.replace(
      /(\breact\(\))(,?\s*\n)/,
      '$1,\n      tailwindcss()$2'
    );
  }

  writeText(configPath, content);
  logOk('vite.config.ts — added @tailwindcss/vite plugin');
}

/**
 * 3. Create src/styles/tailwind.css
 *
 * The `@theme` block maps the project's Open Props CSS custom properties to
 * Tailwind's design-token namespace so utility classes like `text-brand`,
 * `bg-surface`, `p-size-2` etc. reference the same tokens as SCSS.
 */
function createTailwindCss(destDir: string): void {
  const tailwindCss = `/* ─────────────────────────────────────────────────────────────────────────────
 * Tailwind CSS v4 — imported alongside SCSS Modules.
 *
 * This file is the single entry-point for Tailwind.  The @theme block below
 * bridges the project's Open Props / brand design tokens into Tailwind's
 * utility-class namespace so both styling systems share the same palette.
 *
 * Usage:  apply Tailwind utilities directly on JSX elements:
 *   <div className="flex items-center gap-2 text-brand bg-surface rounded-lg p-4">
 *
 * Scoped component styles still live in *.module.scss files — the two
 * approaches coexist without conflict.
 * ───────────────────────────────────────────────────────────────────────────── */
@import "tailwindcss";

/* ─── Theme bridge: map CSS custom properties → Tailwind tokens ───────────── */
@theme {
  /* Brand colours — driven by the same --brand-* vars that SCSS uses */
  --color-brand: hsl(var(--brand-hue) var(--brand-saturation) var(--brand-lightness));
  --color-brand-light: hsl(var(--brand-hue) var(--brand-saturation) calc(var(--brand-lightness) + 15%));
  --color-brand-dark: hsl(var(--brand-hue) var(--brand-saturation) calc(var(--brand-lightness) - 15%));

  /* Surface / background tokens */
  --color-surface: var(--surface-1);
  --color-surface-alt: var(--surface-2);
  --color-surface-elevated: var(--surface-3);

  /* Text tokens */
  --color-text: var(--text-1);
  --color-text-muted: var(--text-2);

  /* Open Props size scale — available as p-size-1, gap-size-2, etc. */
  --spacing-size-1: var(--size-1);
  --spacing-size-2: var(--size-2);
  --spacing-size-3: var(--size-3);
  --spacing-size-4: var(--size-4);
  --spacing-size-5: var(--size-5);
  --spacing-size-6: var(--size-6);
  --spacing-size-7: var(--size-7);
  --spacing-size-8: var(--size-8);

  /* Border radius tokens */
  --radius-sm: var(--radius-2);
  --radius-md: var(--radius-3);
  --radius-lg: var(--radius-4);
}
`;

  const stylesDir = path.join(destDir, 'src', 'styles');
  writeText(path.join(stylesDir, 'tailwind.css'), tailwindCss);
  logOk('src/styles/tailwind.css — created with theme bridge');
}

/** 4. Import tailwind.css in main.tsx (before the SCSS import) */
function importTailwindInMain(destDir: string): void {
  const mainPath = path.join(destDir, 'src', 'main.tsx');
  if (!exists(mainPath)) return;

  let content = readText(mainPath);

  const tailwindImport = "import '@styles/tailwind.css';";
  if (content.includes(tailwindImport)) return;

  // Insert before the existing SCSS/styles import so Tailwind's base reset
  // loads first and SCSS overrides can take precedence.
  const scssImportRegex = /^(import\s+['"]@styles\/.*['"];?\s*)$/m;
  const scssMatch = scssImportRegex.exec(content);

  if (scssMatch) {
    content = content.replace(
      scssMatch[0],
      `${tailwindImport}\n${scssMatch[0]}`
    );
  } else {
    // Fallback: add after the last import
    const importRegex = /^import .+;\s*$/gm;
    let lastImportEnd = 0;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportEnd = match.index + match[0].length;
    }
    content =
      content.slice(0, lastImportEnd) +
      `\n${tailwindImport}` +
      content.slice(lastImportEnd);
  }

  writeText(mainPath, content);
  logOk('src/main.tsx — added tailwind.css import');
}

// ─── Setup script cleanup ─────────────────────────────────────────────────────

function cleanupSetupScripts(
  destDir: string,
  opts: { enablePwa: boolean; enableDocker: boolean; enableHusky: boolean }
): void {
  const scriptsToRemove: string[] = [];

  if (!opts.enablePwa) scriptsToRemove.push('setup-pwa.js');
  if (!opts.enableDocker) scriptsToRemove.push('setup-docker.js');
  if (!opts.enableHusky) scriptsToRemove.push('setup-husky.js');

  if (scriptsToRemove.length === 0) return;

  logStep('Removing unused setup scripts');
  for (const script of scriptsToRemove) {
    const scriptPath = path.join(destDir, 'scripts', script);
    if (safeUnlink(scriptPath)) {
      logOk(`scripts/${script} — removed`);
    }
  }
}

// ─── Brand colour injection ───────────────────────────────────────────────────

// ── Minimal hex / HSL helpers (no runtime dependencies) ──────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function normHex(hex: string): string {
  const h = hex.replace('#', '');
  return '#' + (h.length === 3 ? h.split('').map(c => c + c).join('') : h).toLowerCase();
}

// ── Brand colour injection ────────────────────────────────────────────────────

/**
 * Generates `src/styles/themes/_brand.scss` in the scaffolded project.
 *
 * The new theme system is driven entirely by CSS custom properties on `html`:
 *   --brand-hue / --brand-saturation / --brand-lightness  (primary)
 *   --brand-secondary                                     (secondary)
 *   --brand-accent / --accent                             (tertiary/accent)
 *
 * This file overrides those foundation vars so the whole light+dark palette
 * derives from the chosen brand colour automatically.
 * It is forwarded last in `themes/_index.scss` so it wins the cascade.
 */
function injectBrandColors(
  destDir: string,
  opts: Pick<ScaffoldOptions, 'brandPrimary' | 'brandSecondary' | 'brandTertiary'>
): void {
  if (!opts.brandPrimary && !opts.brandSecondary && !opts.brandTertiary) return;

  logStep('Injecting brand colours');

  const htmlLines: string[] = [];

  // Primary → drives --brand-hue / --brand-saturation / --brand-lightness
  if (opts.brandPrimary) {
    const { r, g, b } = hexToRgb(normHex(opts.brandPrimary));
    const { h, s, l } = rgbToHsl(r, g, b);
    htmlLines.push(
      `  /* Primary brand — derived from ${opts.brandPrimary} */`,
      `  --brand-hue: ${Math.round(h)};`,
      `  --brand-saturation: ${Math.round(s)}%;`,
      `  --brand-lightness: ${Math.round(l)}%;`,
    );
  }

  // Secondary → overrides --brand-secondary directly
  if (opts.brandSecondary) {
    const { r, g, b } = hexToRgb(normHex(opts.brandSecondary));
    const { h, s, l } = rgbToHsl(r, g, b);
    htmlLines.push(
      ``,
      `  /* Secondary brand — derived from ${opts.brandSecondary} */`,
      `  --brand-secondary: hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%);`,
      `  --brand-secondary-hsl: ${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%;`,
    );
  }

  // Tertiary/accent → overrides --brand-accent / --accent / --accent-hue
  if (opts.brandTertiary) {
    const { r, g, b } = hexToRgb(normHex(opts.brandTertiary));
    const { h, s, l } = rgbToHsl(r, g, b);
    htmlLines.push(
      ``,
      `  /* Accent / tertiary — derived from ${opts.brandTertiary} */`,
      `  --accent-hue: ${Math.round(h)};`,
      `  --accent: hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%);`,
      `  --brand-accent: hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%);`,
    );
  }

  const brandScss = [
    '// Brand colours — generated by create-tast-app.',
    '// Overrides the CSS custom property foundation in _base.scss.',
    '// All light + dark palette stops derive automatically from these vars.',
    '// Edit the hue/saturation/lightness values here to retheme the entire app.',
    '',
    'html {',
    ...htmlLines,
    '}',
    '',
  ].join('\n');

  const themesDir = path.join(destDir, 'src', 'styles', 'themes');
  const brandPath = path.join(themesDir, '_brand.scss');
  writeText(brandPath, brandScss);
  logOk('src/styles/themes/_brand.scss — created');

  // Append @forward after existing entries so overrides win the cascade
  const indexPath = path.join(themesDir, '_index.scss');
  if (exists(indexPath)) {
    let idx = readText(indexPath);
    if (!idx.includes("@forward './brand'")) {
      idx = idx.trimEnd() + "\n@forward './brand';\n";
      writeText(indexPath, idx);
      logOk("src/styles/themes/_index.scss — added @forward './brand'");
    }
  }
}

// ─── .env.local generation ───────────────────────────────────────────────────

/**
 * Copy `.env.example` → `.env.local` with `VITE_APP_TITLE` set to the
 * user's app name.  This gives a working local environment out of the box
 * without the user needing to manually copy the file.
 *
 * If `.env.example` doesn't exist in the template (shouldn't happen, but
 * defensive), the step is silently skipped.
 */
function generateEnvLocal(destDir: string, appName: string): void {
  const examplePath = path.join(destDir, '.env.example');
  const localPath = path.join(destDir, '.env.local');

  if (!exists(examplePath)) {
    logInfo('.env.example not found — skipping .env.local generation');
    return;
  }

  let content = readText(examplePath);

  // Replace the default title with the user's app name
  const appTitle = toTitle(appName);
  content = content.replace(
    /^VITE_APP_TITLE=.*/m,
    `VITE_APP_TITLE=${appTitle}`,
  );

  writeText(localPath, content);
  logOk('.env.local generated from .env.example');
}

// ─── Template-only docs cleanup ──────────────────────────────────────────────

/**
 * Removes markdown files that belong to the template repo itself and have
 * no meaning inside a freshly-scaffolded consumer app.
 */
function cleanupTemplateDocs(destDir: string): void {
  const docFiles = [
    'TEMPLATE_ANALYSIS.md',
    'REFACTORING.md',
    'GETTING_STARTED.md',
  ];

  logStep('Removing template documentation files');
  let removed = 0;
  for (const f of docFiles) {
    if (safeUnlink(path.join(destDir, f))) {
      logOk(`${f} — removed`);
      removed++;
    }
  }
  if (removed === 0) logInfo('No template docs found to remove');
}

// ─── Git init ────────────────────────────────────────────────────────────────

/**
 * Initialise a fresh git repo and make an initial commit so the user starts
 * with a clean working tree.  Fails silently if git is unavailable (the
 * scaffold is still perfectly usable without VCS).
 */
function initGitRepo(destDir: string, appName: string): void {
  logStep('Initialising git repository');

  if (!commandExists('git')) {
    logInfo('git not found — skipping repository initialisation');
    return;
  }

  const gitInit = exec('git init', destDir);
  if (!gitInit.success) {
    logInfo('git init failed — skipping repository initialisation');
    return;
  }
  logOk('git init');

  const gitAdd = exec('git add -A', destDir);
  if (!gitAdd.success) {
    logInfo('git add failed — skipping initial commit');
    return;
  }

  const msg = `Initial commit from create-tast-app (${appName})`;
  const gitCommit = exec(
    `git commit -m "${msg}" --no-verify`,
    destDir,
  );
  if (gitCommit.success) {
    logOk('Initial commit created');
  } else {
    logInfo('Initial commit skipped (git commit failed)');
  }
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function removePkgScript(destDir: string, scriptName: string): void {
  const pkgPath = path.join(destDir, 'package.json');
  if (!exists(pkgPath)) return;

  const pkg = readJson(pkgPath);
  const scripts = pkg['scripts'] as Record<string, string> | undefined;
  if (scripts?.[scriptName]) {
    delete scripts[scriptName];
    writeJson(pkgPath, pkg);
  }
}

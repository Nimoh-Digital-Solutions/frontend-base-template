import path from 'path';
import {
  exists,
  exec,
  logStep,
  logOk,
  logInfo,
  readText,
  writeText,
  readJson,
  writeJson,
  safeUnlink,
  safeRmDir,
  removeMarkedSection,
  toPackageName,
  toTitle,
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
  enablePwa: boolean;
  enableDocker: boolean;
  enableHusky: boolean;
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const { appName, description, destDir, enablePwa, enableDocker, enableHusky } = opts;

  if (exists(destDir)) {
    throw new Error(`Directory "${path.basename(destDir)}" already exists.`);
  }

  // 1. Clone template
  await cloneTemplate(destDir);

  // 2. Strip git history (fresh start)
  safeRmDir(path.join(destDir, '.git'));
  logOk('Removed .git history — clean slate');

  // 3. Token replace
  logStep('Customising template');
  replaceTokens(destDir, appName, description);

  // 4. Optional feature removal
  if (!enableDocker) {
    logStep('Removing Docker configuration');
    removeDocker(destDir);
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
}

// ─── Clone ───────────────────────────────────────────────────────────────────

async function cloneTemplate(destDir: string): Promise<void> {
  logStep(`Cloning template into ${path.basename(destDir)}`);

  const result = exec(
    `git clone --depth 1 ${TEMPLATE_REPO} "${path.basename(destDir)}"`,
    path.dirname(destDir),
    'inherit'
  );

  if (!result.success) {
    throw new Error(`Failed to clone template: ${result.error ?? 'unknown error'}`);
  }

  logOk('Template cloned');
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
    writeJson(pkgPath, pkg);
    logOk('package.json — name, description, version');
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

// ─── Docker removal ──────────────────────────────────────────────────────────

function removeDocker(destDir: string): void {
  const files = ['Dockerfile', 'docker-compose.yml', '.dockerignore', 'nginx.conf'];
  let deleted = 0;

  for (const f of files) {
    if (safeUnlink(path.join(destDir, f))) deleted++;
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

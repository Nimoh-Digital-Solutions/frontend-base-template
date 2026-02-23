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
  injectBrandColors(destDir, opts);

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

  // 6. Remove template-only docs that are not relevant to a scaffolded app
  cleanupTemplateDocs(destDir);
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

    // Strip monorepo-only fields that must not exist in a scaffolded app.
    // Leaving "workspaces" causes Yarn to treat the new project as a workspace
    // root, which makes it resolve @nimoh-digital-solutions/* packages to local
    // symlinks (no dist/) instead of the published npm registry packages.
    delete pkg['workspaces'];

    const scripts = pkg['scripts'] as Record<string, string> | undefined;
    if (scripts) {
      delete scripts['packages:build'];
      delete scripts['packages:typecheck'];
      delete scripts['changeset'];
      delete scripts['changeset:version'];
      delete scripts['changeset:publish'];
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

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

function normHex(hex: string): string {
  const h = hex.replace('#', '');
  return '#' + (h.length === 3 ? h.split('').map(c => c + c).join('') : h).toLowerCase();
}

/** Derive a 4-stop palette from a single base hex:
 *  100 = very light tint, 400 = slightly lighter, 500 = base, 900 = deep shade */
function derivePalette(hex: string): Record<'100' | '400' | '500' | '900', string> {
  const base = normHex(hex);
  const { r, g, b } = hexToRgb(base);
  const { h, s, l } = rgbToHsl(r, g, b);
  return {
    '100': hslToHex(h, Math.max(s - 15, 8), Math.min(l + 42, 93)),
    '400': hslToHex(h, s, Math.min(l + 12, 82)),
    '500': base,
    '900': hslToHex(h, Math.min(s + 12, 100), Math.max(l - 32, 10)),
  };
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

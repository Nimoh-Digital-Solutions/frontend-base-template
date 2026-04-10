import fs from 'fs';
import path from 'path';
import {
  exec,
  execAsync,
  exists,
  logError,
  logOk,
  logStep,
  logWarn,
  readJson,
  readText,
  safeRmDir,
  toKebab,
  toSlug,
  writeJson,
  writeText,
} from './utils.js';
import { createSpinner } from './spinner.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATE_REPO =
  'https://github.com/Nimoh-Digital-Solutions/react-native-base-template.git';

// ─── Public interface ─────────────────────────────────────────────────────────

export interface ScaffoldOptions {
  appName: string;
  destDir: string;
  portOffset: number;
  bundleId?: string;
  easProjectId?: string;
  initGit?: boolean;
}

/**
 * Scaffold a React Native (Expo) mobile app from the base template.
 *
 * 1. Clone the template from GitHub
 * 2. Strip the self-contained packages/shared/ (orchestrator generates it)
 * 3. Adjust @shared/* paths from self-contained to monorepo-relative
 * 4. Replace tokens (name, slug, bundle ID, API URL, etc.)
 * 5. Optionally init git + initial commit
 */
export async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const { appName, destDir, portOffset, initGit = true } = opts;

  if (exists(destDir)) {
    throw new Error(`Directory "${destDir}" already exists.`);
  }

  try {
    await scaffoldInner(opts);
  } catch (err) {
    // Rollback: remove partially created directory
    safeRmDir(destDir);
    throw err;
  }
}

// ─── Implementation ──────────────────────────────────────────────────────────

async function scaffoldInner(opts: ScaffoldOptions): Promise<void> {
  const { appName, destDir, portOffset, initGit = true } = opts;
  const kebab = toKebab(appName);
  const slug = toSlug(appName);
  const bundleId = opts.bundleId ?? `com.example.${slug}`;
  const easProjectId = opts.easProjectId ?? '00000000-0000-0000-0000-000000000000';
  const apiUrl = `http://localhost:${8000 + portOffset}/api/v1`;

  // 1. Clone template
  await cloneTemplate(destDir);

  // 2. Strip self-contained packages/shared/
  stripBundledShared(destDir);

  // 3. Adjust @shared/* paths to monorepo-relative
  adjustSharedPaths(destDir);

  // 4. Token replacement
  replaceTokens(destDir, {
    '{{PROJECT_NAME}}': kebab,
    '{{PROJECT_SLUG}}': slug,
    '{{BUNDLE_ID}}': bundleId,
    '{{API_URL}}': apiUrl,
    '{{EAS_PROJECT_ID}}': easProjectId,
    '{{PORT_OFFSET}}': String(portOffset),
  });

  // 5. Create .env from .env.example so the app runs out of the box
  createDotEnv(destDir, apiUrl);

  // 6. Clean up template artifacts
  cleanupArtifacts(destDir);

  // 7. Git init
  if (initGit) {
    initGitRepo(destDir);
  }

  logOk('Mobile app scaffolded');
}

// ─── Step 1: Clone ───────────────────────────────────────────────────────────

async function cloneTemplate(destDir: string): Promise<void> {
  logStep('Cloning react-native-base-template');

  const parentDir = path.dirname(destDir);
  const dirName = path.basename(destDir);

  const spinner = createSpinner('Downloading template…');

  const result = await execAsync(
    `git clone --depth 1 "${TEMPLATE_REPO}" "${dirName}"`,
    parentDir,
  );

  if (!result.success) {
    spinner.fail('Clone failed');
    logError(result.error ?? 'unknown error');
    throw new Error('Failed to clone react-native-base-template');
  }

  spinner.succeed('Template cloned');
}

// ─── Step 2: Strip bundled packages/shared/ ──────────────────────────────────

function stripBundledShared(destDir: string): void {
  const sharedDir = path.join(destDir, 'packages');
  if (exists(sharedDir)) {
    safeRmDir(sharedDir);
    logOk('Stripped bundled packages/shared/ (orchestrator provides this)');
  }
}

// ─── Step 3: Adjust @shared/* paths to monorepo-relative ────────────────────

/**
 * The template has @shared/* pointing to ./packages/shared/src/* (self-contained).
 * In the scaffolded monorepo, shared lives at ../packages/shared/src/*.
 */
function adjustSharedPaths(destDir: string): void {
  // tsconfig.json
  patchFile(
    path.join(destDir, 'tsconfig.json'),
    './packages/shared/src/*',
    '../packages/shared/src/*',
    'tsconfig @shared/* path',
  );
  patchFile(
    path.join(destDir, 'tsconfig.json'),
    '"packages/shared/src"',
    '"../packages/shared/src"',
    'tsconfig include path',
  );
  patchFile(
    path.join(destDir, 'tsconfig.json'),
    '"packages/shared/src/**/__tests__/**"',
    '"../packages/shared/src/**/__tests__/**"',
    'tsconfig exclude path',
  );

  // babel.config.js
  patchFile(
    path.join(destDir, 'babel.config.js'),
    "'./packages/shared/src'",
    "'../packages/shared/src'",
    'babel @shared alias',
  );

  // metro.config.js — watchFolders and nodeModulesPaths
  const metroPath = path.join(destDir, 'metro.config.js');
  if (exists(metroPath)) {
    let metro = readText(metroPath);

    // Replace self-contained watchFolders with monorepo-relative
    metro = metro.replace(
      /config\.watchFolders\s*=\s*\[.*?\];/s,
      "config.watchFolders = [path.resolve(projectRoot, '..', 'packages', 'shared')];",
    );

    // Add monorepo root to nodeModulesPaths
    metro = metro.replace(
      /config\.resolver\.nodeModulesPaths\s*=\s*\[.*?\];/s,
      `config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, '..', 'node_modules'),
];`,
    );

    writeText(metroPath, metro);
    logOk('Adjusted metro.config.js for monorepo layout');
  }

  // package.json Jest moduleNameMapper
  const pkgPath = path.join(destDir, 'package.json');
  if (exists(pkgPath)) {
    let pkgText = readText(pkgPath);
    pkgText = pkgText.replace(
      '<rootDir>/packages/shared/src/$1',
      '<rootDir>/../packages/shared/src/$1',
    );
    writeText(pkgPath, pkgText);
    logOk('Adjusted Jest @shared moduleNameMapper');
  }
}

// ─── Step 4: Token replacement ───────────────────────────────────────────────

function replaceTokens(
  destDir: string,
  tokens: Record<string, string>,
): void {
  logStep('Replacing template tokens');

  const targetFiles = [
    'package.json',
    'app.json',
    'eas.json',
    '.env.example',
    'src/navigation/linking.ts',
    'README.md',
  ];

  for (const relPath of targetFiles) {
    const absPath = path.join(destDir, relPath);
    if (!exists(absPath)) continue;

    let content = readText(absPath);
    let changed = false;

    for (const [token, value] of Object.entries(tokens)) {
      if (content.includes(token)) {
        content = content.replaceAll(token, value);
        changed = true;
      }
    }

    if (changed) {
      writeText(absPath, content);
      logOk(relPath);
    }
  }
}

// ─── Step 5: Create .env ─────────────────────────────────────────────────────

function createDotEnv(destDir: string, apiUrl: string): void {
  const examplePath = path.join(destDir, '.env.example');
  const envPath = path.join(destDir, '.env');

  if (exists(examplePath)) {
    let content = readText(examplePath);
    content = content.replace(
      /^EXPO_PUBLIC_API_URL=.*/m,
      `EXPO_PUBLIC_API_URL=${apiUrl}`,
    );
    writeText(envPath, content);
    logOk('.env created from .env.example');
  }
}

// ─── Step 6: Cleanup ────────────────────────────────────────────────────────

function cleanupArtifacts(destDir: string): void {
  // Remove .git from clone
  safeRmDir(path.join(destDir, '.git'));

  // Remove yarn.lock (will be regenerated on install)
  const lockPath = path.join(destDir, 'yarn.lock');
  if (exists(lockPath)) {
    fs.unlinkSync(lockPath);
  }

  // Remove README (project root has its own)
  const readmePath = path.join(destDir, 'README.md');
  if (exists(readmePath)) {
    fs.unlinkSync(readmePath);
  }

  // Remove LICENSE (project root has its own)
  const licensePath = path.join(destDir, 'LICENSE');
  if (exists(licensePath)) {
    fs.unlinkSync(licensePath);
  }
}

// ─── Step 7: Git init ────────────────────────────────────────────────────────

function initGitRepo(destDir: string): void {
  const gitResult = exec('git init', destDir);
  if (!gitResult.success) return;

  exec('git add -A', destDir);
  exec('git commit -m "Initial mobile app — scaffolded by create-tast-mobile-app"', destDir);
  logOk('Git repository initialised with initial commit');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function patchFile(
  absPath: string,
  search: string,
  replacement: string,
  description: string,
): void {
  if (!exists(absPath)) return;
  const content = readText(absPath);
  if (!content.includes(search)) {
    logWarn(`Patch had no effect: ${description}`);
    return;
  }
  writeText(absPath, content.replace(search, replacement));
}

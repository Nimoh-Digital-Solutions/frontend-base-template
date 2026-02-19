#!/usr/bin/env node
// @ts-check

/**
 * Master Setup Script
 * Interactive configuration for optional features (PWA, Testing, Husky, Docker)
 * Coordinates removal of features and self-destructs when all features are removed
 */

import fs from 'fs';
import path from 'path';
import {
  getRootDir,
  exists,
  readJson,
  writeJson,
  readText,
  writeText,
  safeUnlink,
  safeRmdirIfEmpty,
  removePkgScript,
  removeMarkedSection,
  createRl,
  askYesNo,
  askConfirm,
  isDirectRun,
  logStep,
  logOk,
  logInfo,
  logWarn,
} from './_setup-utils.js';

const rootDir = getRootDir();
const thisFile = path.join(rootDir, 'scripts/setup.js');

/**
 * Check if PWA support is present in the project
 * @returns {boolean} True if PWA features are detected
 */
function hasPWA() {
  const pkgPath = path.join(rootDir, 'package.json');

  // Check for PWA files
  const fileSignals = [
    'plugins/pwa.ts',
    'src/sw/pwa.ts',
    'src/utils/pwa.ts',
    'public/manifest.webmanifest',
  ].some(rel => exists(path.join(rootDir, rel)));
  if (fileSignals) return true;

  // Check package.json for vite-plugin-pwa
  if (exists(pkgPath)) {
    const pkg = readJson(pkgPath);
    if (pkg.devDependencies?.['vite-plugin-pwa'] || pkg.dependencies?.['vite-plugin-pwa'])
      return true;
  }

  // Check index.html for manifest link
  const indexPath = path.join(rootDir, 'index.html');
  if (exists(indexPath)) {
    const html = readText(indexPath);
    if (/rel=["']manifest["']/.test(html)) return true;
  }

  return false;
}

/**
 * Check if testing infrastructure is present in the project
 * @returns {boolean} True if testing features are detected
 */
function hasTesting() {
  const pkgPath = path.join(rootDir, 'package.json');

  // Check package.json for vitest
  if (exists(pkgPath)) {
    const pkg = readJson(pkgPath);
    if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) return true;
  }

  // Check for test directory
  if (exists(path.join(rootDir, 'src/test'))) return true;

  // Check vite.config.ts for test block
  const vitePath = path.join(rootDir, 'vite.config.ts');
  if (exists(vitePath)) {
    const c = readText(vitePath);
    if (/\btest\s*:\s*\{/.test(c)) return true;
  }

  // Quick scan for test files in common directories
  const scanDirs = ['src/components', 'src/hooks', 'src/utils'].map(d => path.join(rootDir, d));
  for (const d of scanDirs) {
    if (!exists(d)) continue;
    try {
      const items = fs.readdirSync(d);
      if (items.some(f => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f))) return true;
    } catch {
      // Skip directories we can't read
    }
  }

  return false;
}

/**
 * Check if Husky (Git hooks) is present in the project
 * @returns {boolean} True if Husky is detected
 */
function hasHusky() {
  const pkgPath = path.join(rootDir, 'package.json');

  // Check for .husky directory
  if (exists(path.join(rootDir, '.husky'))) return true;

  // Check package.json for husky or commitlint
  if (exists(pkgPath)) {
    const pkg = readJson(pkgPath);
    if (
      pkg.devDependencies?.husky ||
      pkg.dependencies?.husky ||
      pkg.devDependencies?.['lint-staged'] ||
      pkg.devDependencies?.['@commitlint/cli']
    )
      return true;
  }

  // Check for commitlint config
  const commitlintConfigs = [
    'commitlint.config.js',
    'commitlint.config.cjs',
    'commitlint.config.mjs',
  ];
  if (commitlintConfigs.some(f => exists(path.join(rootDir, f)))) return true;

  return false;
}

/**
 * Check if Docker configuration is present in the project
 * @returns {boolean} True if Docker is detected
 */
function hasDocker() {
  // Check for Docker files
  const dockerFiles = ['Dockerfile', 'docker-compose.yml', '.dockerignore', 'nginx.conf'];
  if (dockerFiles.some(f => exists(path.join(rootDir, f)))) return true;

  return false;
}

/**
 * Remove setup section from README when all features are removed
 * @returns {boolean} True if changes were made
 */
function cleanupReadme() {
  const readmePath = path.join(rootDir, 'README.md');
  if (!exists(readmePath)) return false;

  const before = readText(readmePath);
  let after = before;

  // Remove the Initial Setup section
  after = removeMarkedSection(after, 'SETUP');

  // Remove yarn setup from Available Scripts
  after = after.replace(/^\s*yarn setup\s*\n/gm, '');

  // Clean up excessive blank lines
  after = after.replace(/\n{3,}/g, '\n\n');

  if (after !== before) {
    writeText(readmePath, after);
    return true;
  }
  return false;
}

/**
 * Main setup flow
 */
async function run() {
  console.log('🚀 ReactStarterKit Setup\n');
  console.log('Configure optional features (PWA, Testing, Husky, Docker).\n');

  let pwaPresent = hasPWA();
  let testingPresent = hasTesting();
  let huskyPresent = hasHusky();
  let dockerPresent = hasDocker();

  // If no features detected, clean up and exit
  if (!pwaPresent && !testingPresent && !huskyPresent && !dockerPresent) {
    logInfo('No optional features detected. Removing setup script.');
    removePkgScript(rootDir, 'setup');
    safeUnlink(thisFile);
    return;
  }

  try {
    // Build list of available features
    const choices = [];
    if (pwaPresent) choices.push({ title: 'PWA Support', value: 'pwa', selected: true });
    if (testingPresent)
      choices.push({ title: 'Testing Infrastructure', value: 'testing', selected: true });
    if (huskyPresent) choices.push({ title: 'Git Hooks (Husky)', value: 'husky', selected: true });
    if (dockerPresent) choices.push({ title: 'Docker Support', value: 'docker', selected: true });

    // Show multi-select prompt
    const prompts = (await import('prompts')).default;
    const response = await prompts({
      type: 'multiselect',
      name: 'features',
      message: 'Select features to KEEP (use space to toggle, enter to confirm):',
      choices,
      hint: '- Space to select. Return to submit',
    });

    // Handle Ctrl+C or ESC
    if (!response.features) {
      console.log('\nOperation cancelled');
      return;
    }

    const selectedFeatures = new Set(response.features);

    // Determine which features to remove
    const toRemove = [];
    if (pwaPresent && !selectedFeatures.has('pwa')) toRemove.push('PWA Support');
    if (testingPresent && !selectedFeatures.has('testing')) toRemove.push('Testing Infrastructure');
    if (huskyPresent && !selectedFeatures.has('husky')) toRemove.push('Git Hooks (Husky)');
    if (dockerPresent && !selectedFeatures.has('docker')) toRemove.push('Docker Support');

    // If nothing to remove, exit
    if (toRemove.length === 0) {
      logOk('All features retained');
      return;
    }

    // Show confirmation warning with detailed list
    const featureList = toRemove.map(f => `  • ${f}`).join('\n');
    const confirmed = await askConfirm(
      `⚠️  WARNING: The following features will be permanently removed:\n\n${featureList}\n\nAll files, dependencies, and configurations will be deleted. This cannot be undone.\n\nContinue?`
    );

    if (!confirmed) {
      logInfo('Operation cancelled');
      return;
    }

    // Remove unselected features
    if (pwaPresent && !selectedFeatures.has('pwa')) {
      const pwa = await import('./setup-pwa.js');
      await pwa.apply({ rootDir, keep: false, selfDestruct: true });
      logOk('PWA removed');
    }

    if (testingPresent && !selectedFeatures.has('testing')) {
      const testing = await import('./setup-testing.js');
      await testing.apply({ rootDir, keep: false, selfDestruct: true });
      logOk('Testing removed');
    }

    if (huskyPresent && !selectedFeatures.has('husky')) {
      const husky = await import('./setup-husky.js');
      await husky.apply({ rootDir, keep: false, selfDestruct: true });
      logOk('Git hooks removed');
    }

    if (dockerPresent && !selectedFeatures.has('docker')) {
      const docker = await import('./setup-docker.js');
      await docker.apply({ rootDir, keep: false, selfDestruct: true });
      logOk('Docker configuration removed');
    }
  } catch (err) {
    console.error('\nError during setup:', err);
  }

  // Re-check feature presence after child scripts ran
  pwaPresent = hasPWA();
  testingPresent = hasTesting();
  huskyPresent = hasHusky();
  dockerPresent = hasDocker();

  console.log('\n✓ Setup complete!');
  console.log(
    'If anything was removed, run your package manager install command to update the lockfile.'
  );

  // Self-destruct if all features are gone
  if (!pwaPresent && !testingPresent && !huskyPresent && !dockerPresent) {
    logStep('Cleaning up master setup');

    if (cleanupReadme()) {
      logOk('Removed setup section from README.md');
    }

    // Remove prompts package (only used by setup scripts)
    const pkgPath = path.join(rootDir, 'package.json');
    if (exists(pkgPath)) {
      const pkg = readJson(pkgPath);
      let changed = false;

      if (pkg.devDependencies?.prompts) {
        delete pkg.devDependencies.prompts;
        changed = true;
      }
      if (pkg.devDependencies?.['@types/prompts']) {
        delete pkg.devDependencies['@types/prompts'];
        changed = true;
      }

      if (changed) {
        writeJson(pkgPath, pkg);
        logOk('Removed prompts package from package.json');
      }
    }

    removePkgScript(rootDir, 'setup');
    if (safeUnlink(thisFile)) logOk('Removed setup + deleted scripts/setup.js');

    // Clean up empty scripts directory
    safeRmdirIfEmpty(path.join(rootDir, 'scripts'));
    return;
  }

  // If features remain, inform user they can run again
  if (pwaPresent || testingPresent || huskyPresent || dockerPresent) {
    logInfo('You can run "yarn setup" again later to configure remaining features.');
  } else {
    logWarn('Unexpected: features not detected but master did not self remove.');
  }
}

if (isDirectRun(import.meta.url)) {
  run();
}

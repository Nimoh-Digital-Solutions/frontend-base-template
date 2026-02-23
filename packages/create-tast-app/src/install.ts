import { exec, commandExists, logStep, logOk, logError } from './utils.js';

export type PackageManager = 'yarn' | 'npm' | 'pnpm';

/**
 * Run the package manager install command in the given directory.
 * Falls back to npm if the chosen manager is not installed.
 */
export async function install(destDir: string, manager: PackageManager): Promise<boolean> {
  const resolvedManager = resolvePackageManager(manager);
  const installCmd = buildInstallCommand(resolvedManager);

  logStep(`Installing dependencies with ${resolvedManager}`);

  // GitHub Packages requires an auth token for @nimoh-digital-solutions/* packages.
  // Yarn 4 reads NPM_TOKEN via ${NPM_TOKEN} interpolation in .yarnrc.yml — warn early
  // if it is missing so the user gets a clear message instead of a cryptic 401/404.
  if (resolvedManager === 'yarn' && !process.env['NPM_TOKEN']) {
    console.warn('');
    console.warn('  ⚠️  NPM_TOKEN is not set.');
    console.warn('  ⚠️  @nimoh-digital-solutions/* packages are hosted on GitHub Packages');
    console.warn('  ⚠️  and require a personal access token with read:packages scope.');
    console.warn('  ⚠️  Create one at https://github.com/settings/tokens and set it:');
    console.warn('  ⚠️    export NPM_TOKEN=<your-token>');
    console.warn('');
  }

  const result = exec(installCmd, destDir, 'inherit');

  if (!result.success) {
    logError(`Install failed: ${result.error ?? 'unknown error'}`);
    logError(`You can install manually: cd ${destDir} && ${installCmd}`);
    return false;
  }

  logOk('Dependencies installed');
  return true;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolvePackageManager(preferred: PackageManager): PackageManager {
  if (commandExists(preferred)) return preferred;

  // Fallback order
  const fallbacks: PackageManager[] = ['yarn', 'npm', 'pnpm'];
  for (const pm of fallbacks) {
    if (pm !== preferred && commandExists(pm)) {
      console.warn(
        `  ! "${preferred}" not found — falling back to "${pm}"`
      );
      return pm;
    }
  }

  return 'npm'; // npm is always available with Node.js
}

function buildInstallCommand(manager: PackageManager): string {
  switch (manager) {
    case 'yarn':
      return 'yarn install';
    case 'pnpm':
      return 'pnpm install';
    case 'npm':
    default:
      return 'npm install';
  }
}

/**
 * Return the dev-server start command for the given package manager.
 */
export function devCommand(manager: PackageManager): string {
  switch (manager) {
    case 'yarn':
      return 'yarn dev';
    case 'pnpm':
      return 'pnpm dev';
    case 'npm':
    default:
      return 'npm run dev';
  }
}

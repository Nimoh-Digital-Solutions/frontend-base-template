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

  // @nimoh-digital-solutions/* packages are on GitHub Packages which requires auth
  // even for reads. Yarn 4 reads the token via ${NPM_TOKEN:-} in .yarnrc.yml — when
  // the var is absent the registry returns 401 (anonymous). Bail immediately so the
  // user gets a clear message rather than a confusing Yarn error.
  if (resolvedManager === 'yarn' && !process.env['NPM_TOKEN']) {
    console.warn('');
    console.warn('  ⚠️  Skipping install — NPM_TOKEN is not set.');
    console.warn('  ⚠️  @nimoh-digital-solutions/* packages require a GitHub personal access');
    console.warn('  ⚠️  token with read:packages scope. See next steps below.');
    console.warn('');
    return false;
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

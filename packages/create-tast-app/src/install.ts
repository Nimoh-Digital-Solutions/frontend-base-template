import { createSpinner } from './spinner.js';
import { exec, execAsync, commandExists, logOk, logError } from './utils.js';

export type PackageManager = 'yarn' | 'npm' | 'pnpm';

/**
 * Run the package manager install command in the given directory.
 * Falls back to npm if the chosen manager is not installed.
 */
export async function install(destDir: string, manager: PackageManager): Promise<boolean> {
  const resolvedManager = resolvePackageManager(manager);
  const installCmd = buildInstallCommand(resolvedManager);

  // Ensure Corepack is enabled so the packageManager field in package.json
  // activates Yarn 4 instead of the system Yarn 1. Runs silently; ignored if
  // corepack is unavailable (e.g. very old Node).
  if (resolvedManager === 'yarn') {
    exec('corepack enable', destDir, 'pipe');
  }

  const spinner = createSpinner(`Installing dependencies with ${resolvedManager}…`);

  const result = await execAsync(installCmd, destDir);

  if (!result.success) {
    spinner.fail('Install failed');
    logError(result.error ?? 'unknown error');
    logError(`You can install manually: cd ${destDir} && ${installCmd}`);
    return false;
  }

  spinner.succeed('Dependencies installed');
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

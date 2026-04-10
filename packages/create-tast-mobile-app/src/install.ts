import { createSpinner } from './spinner.js';
import { exec, execAsync, commandExists, logError } from './utils.js';

export type PackageManager = 'yarn' | 'npm' | 'pnpm';

export async function install(destDir: string, manager: PackageManager): Promise<boolean> {
  const resolvedManager = resolvePackageManager(manager);
  const installCmd = buildInstallCommand(resolvedManager);

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

function resolvePackageManager(preferred: PackageManager): PackageManager {
  if (commandExists(preferred)) return preferred;

  const fallbacks: PackageManager[] = ['yarn', 'npm', 'pnpm'];
  for (const pm of fallbacks) {
    if (pm !== preferred && commandExists(pm)) {
      console.warn(`  ! "${preferred}" not found — falling back to "${pm}"`);
      return pm;
    }
  }

  return 'npm';
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

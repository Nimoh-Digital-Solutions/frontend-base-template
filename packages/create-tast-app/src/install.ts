import { exec, commandExists, resolveNpmToken, logStep, logOk, logError } from './utils.js';

export type PackageManager = 'yarn' | 'npm' | 'pnpm';

/**
 * Run the package manager install command in the given directory.
 * Falls back to npm if the chosen manager is not installed.
 */
export async function install(destDir: string, manager: PackageManager): Promise<boolean> {
  const resolvedManager = resolvePackageManager(manager);
  const installCmd = buildInstallCommand(resolvedManager);

  logStep(`Installing dependencies with ${resolvedManager}`);

  // @nimoh-digital-solutions/* packages are hosted on GitHub Packages which
  // requires auth even for reads. Yarn 4 reads the token via ${NPM_TOKEN:-}
  // interpolation in .yarnrc.yml.
  //
  // Resolution order (handled by resolveNpmToken):
  //   1. NPM_TOKEN env var   — already exported in the shell / CI / Docker
  //   2. ~/.npmrc            — //npm.pkg.github.com/:_authToken=<value>
  //
  // The resolved token is injected as NPM_TOKEN into the subprocess env so
  // Yarn 4 picks it up, even if the user never ran `export NPM_TOKEN`.
  const extraEnv: Record<string, string> = {};

  if (resolvedManager === 'yarn') {
    const token = resolveNpmToken();
    if (!token) {
      console.warn('');
      console.warn('  ⚠️  Skipping install — no GitHub Packages token found.');
      console.warn('  ⚠️  Set NPM_TOKEN or add the following line to ~/.npmrc:');
      console.warn('  ⚠️    //npm.pkg.github.com/:_authToken=<your-token>');
      console.warn('  ⚠️  Get a token (read:packages scope): https://github.com/settings/tokens');
      console.warn('');
      return false;
    }
    extraEnv['NPM_TOKEN'] = token;
  }

  const result = exec(installCmd, destDir, 'inherit', extraEnv);

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

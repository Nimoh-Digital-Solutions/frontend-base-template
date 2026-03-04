import path from 'path';
import fs from 'fs';
import prompts from 'prompts';

declare const __PACKAGE_VERSION__: string;
import { scaffold } from './scaffold.js';
import { install, devCommand, type PackageManager } from './install.js';
import { logStep, logError, toPackageName, getDestDir, commandExists } from './utils.js';

// ─── Answers shape ────────────────────────────────────────────────────────────

interface Answers {
  appName: string;
  description: string;
  brandPrimary: string;
  brandSecondary: string;
  brandTertiary: string;
  enableTailwind: boolean;
  enablePwa: boolean;
  enableDocker: boolean;
  enableHusky: boolean;
  packageManager: PackageManager;
  installDeps: boolean;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  printBanner();
  abortIfInsideWorkspace();

  // Parse CLI flags
  const args = process.argv.slice(2);
  const yesFlag = args.includes('--yes') || args.includes('-y');
  // First positional arg (not a flag) is the app name
  const argName = args.find(a => !a.startsWith('-'))?.trim();

  // Non-interactive mode: use sensible defaults and skip all prompts
  if (yesFlag) {
    const appName = toPackageName(argName ?? 'my-tast-app');
    const destDir = getDestDir(appName);
    const pm = detectDefaultPm();

    console.log('');
    logStep(`Creating "${appName}" (non-interactive) in ${path.relative(process.cwd(), path.dirname(destDir))}`);

    try {
      await scaffold({
        appName,
        description: '',
        destDir,
        enableTailwind: true,
        enablePwa: true,
        enableDocker: true,
        enableHusky: true,
      });
    } catch (err) {
      logError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }

    const ok = await install(destDir, pm);
    printNextSteps(appName, pm, ok, /* enableDocker */ true);
    return;
  }

  const answers = await prompts<keyof Answers>(
    [
      // App name — skip if provided via argv
      {
        type: argName ? null : 'text',
        name: 'appName',
        message: 'App name:',
        initial: 'my-tast-app',
        validate: (v: string) =>
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(toPackageName(v)) || 'Must be a valid slug',
      },

      // Description
      {
        type: 'text',
        name: 'description',
        message: 'Short description:',
        initial: '',
      },

      // Brand colours — primary drives --brand-hue/saturation/lightness (the
      // whole light+dark palette derives from these). Secondary and tertiary
      // set --brand-secondary and --brand-accent respectively.
      {
        type: 'text',
        name: 'brandPrimary',
        message: 'Brand primary colour (hex, e.g. #415385 — sets brand hue, saturation & lightness; leave blank to keep default):',
        initial: '',
        validate: (v: string) =>
          !v || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)
            || 'Must be a valid hex colour (e.g. #3b82f6 or #38f)',
      },
      {
        type: 'text',
        name: 'brandSecondary',
        message: 'Brand secondary colour (hex — sets --brand-secondary; leave blank for default):',
        initial: '',
        validate: (v: string) =>
          !v || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) || 'Must be a valid hex colour',
      },
      {
        type: 'text',
        name: 'brandTertiary',
        message: 'Brand accent / tertiary colour (hex — sets --brand-accent; leave blank for default):',
        initial: '',
        validate: (v: string) =>
          !v || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) || 'Must be a valid hex colour',
      },

      // Styling — optional Tailwind CSS alongside SCSS Modules
      {
        type: 'toggle',
        name: 'enableTailwind',
        message: 'Enable Tailwind CSS v4? (works alongside SCSS Modules)',
        initial: true,
        active: 'Yes',
        inactive: 'No',
      },

      // Features
      {
        type: 'toggle',
        name: 'enablePwa',
        message: 'Enable PWA support?',
        initial: true,
        active: 'Yes',
        inactive: 'No',
      },
      {
        type: 'toggle',
        name: 'enableDocker',
        message: 'Enable Docker support?',
        initial: true,
        active: 'Yes',
        inactive: 'No',
      },
      {
        type: 'toggle',
        name: 'enableHusky',
        message: 'Enable Husky git hooks?',
        initial: true,
        active: 'Yes',
        inactive: 'No',
      },

      // Package manager
      {
        type: 'select',
        name: 'packageManager',
        message: 'Package manager:',
        choices: buildPmChoices(),
        initial: 0,
      },

      // Install now?
      {
        type: 'toggle',
        name: 'installDeps',
        message: 'Install dependencies now?',
        initial: true,
        active: 'Yes',
        inactive: 'No',
      },
    ],
    {
      onCancel: () => {
        console.log('\nOperation cancelled');
        process.exit(0);
      },
    }
  );

  // Merge argv app name with prompt answers
  const appName = toPackageName(argName ?? answers.appName ?? 'my-tast-app');
  const destDir = getDestDir(appName);

  console.log('');
  logStep(`Creating "${appName}" in ${path.relative(process.cwd(), path.dirname(destDir))}`);

  try {
    await scaffold({
      appName,
      description: answers.description ?? '',
      destDir,
      enableTailwind: answers.enableTailwind ?? true,
      enablePwa: answers.enablePwa ?? true,
      enableDocker: answers.enableDocker ?? true,
      enableHusky: answers.enableHusky ?? true,
      brandPrimary: answers.brandPrimary?.trim() || undefined,
      brandSecondary: answers.brandSecondary?.trim() || undefined,
      brandTertiary: answers.brandTertiary?.trim() || undefined,
    });
  } catch (err) {
    logError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const pm: PackageManager = answers.packageManager ?? 'yarn';

  if (answers.installDeps ?? true) {
    const ok = await install(destDir, pm);
    if (!ok) {
      // Scaffold succeeded — only the install step was skipped/failed.
      // Exit 0 so the calling shell doesn't treat a ready project as an error.
      printNextSteps(appName, pm, /* installed */ false, answers.enableDocker ?? true);
      process.exit(0);
    }
  }

  printNextSteps(appName, pm, answers.installDeps ?? true, answers.enableDocker ?? true);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printBanner(): void {
  console.log('');
  console.log('  ╔════════════════════════════════╗');
  console.log(`  ║     create-tast-app  v${__PACKAGE_VERSION__}    ║`);
  console.log('  ╚════════════════════════════════╝');
  console.log('');
}

/**
 * Warn if the CWD is inside a Yarn workspace root.
 * Apps created inside a workspace will have their scoped packages resolved
 * to local workspace symlinks (no dist/) instead of the published registry.
 */
function abortIfInsideWorkspace(): void {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Record<string, unknown>;
        if (pkg.workspaces) {
          console.error('');
          console.error('  ✗  Cannot create app inside a Yarn workspace.');
          console.error('');
          console.error(`  Workspace root detected at: ${dir}`);
          console.error('');
          console.error('  When you run create-tast-app from inside a workspace, Yarn resolves');
          console.error('  @nimoh-digital-solutions/* packages to local workspace symlinks');
          console.error('  (no dist/) instead of the published registry packages, then fails');
          console.error('  with "Workspace not found" errors for workspace:^ references.');
          console.error('');
          console.error('  Fix: run create-tast-app from a directory outside any monorepo.');
          console.error('  Example:');
          console.error('    cd ~');
          console.error(`    npx @nimoh-digital-solutions/create-tast-app ${process.argv[2] ?? 'my-app'}`);
          console.error('');
          process.exit(1);
        }
      } catch {
        // ignore parse errors
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

function buildPmChoices(): Array<{ title: string; value: PackageManager }> {
  const pms: Array<{ title: string; value: PackageManager }> = [
    { title: 'yarn', value: 'yarn' },
    { title: 'npm', value: 'npm' },
    { title: 'pnpm', value: 'pnpm' },
  ];

  // Detect available package managers and put the first found at the top
  const detected = pms.filter(p => commandExists(p.value));
  const undetected = pms.filter(p => !commandExists(p.value));

  return [
    ...detected.map(p => ({ ...p, title: `${p.title} ✓` })),
    ...undetected,
  ];
}

/**
 * Auto-detect the best available package manager for `--yes` mode.
 * Preference order: yarn → pnpm → npm (npm is always available with Node).
 */
function detectDefaultPm(): PackageManager {
  if (commandExists('yarn')) return 'yarn';
  if (commandExists('pnpm')) return 'pnpm';
  return 'npm';
}

function printNextSteps(appName: string, pm: PackageManager, installed: boolean, enableDocker: boolean): void {
  console.log('');
  console.log('  ✅  Your project is ready!\n');
  console.log('  Next steps:\n');
  console.log(`    cd ${appName}`);
  if (!installed) {
    console.log(`    ${pm} install`);
  }
  console.log(`    ${devCommand(pm)}`);
  if (enableDocker) {
    console.log('');
    console.log('  For Docker (make docker-dev / make docker-prod):');
    console.log(`    Add NPM_TOKEN=<your-token> to your .env file`);
  }
  console.log('');
  console.log('  Docs: https://github.com/Nimoh-Digital-Solutions/frontend-base-template');
  console.log('');
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('\n  ✗ Unexpected error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

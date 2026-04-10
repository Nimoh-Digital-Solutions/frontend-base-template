import path from 'path';
import prompts from 'prompts';

declare const __PACKAGE_VERSION__: string;

import { scaffold } from './scaffold.js';
import { install, type PackageManager } from './install.js';
import { commandExists, getDestDir, logError, logStep, toKebab } from './utils.js';

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(__PACKAGE_VERSION__);
    return;
  }

  printBanner();

  // Parse CLI flags
  const yesFlag = args.includes('--yes') || args.includes('-y');
  const noGitFlag = args.includes('--no-git');
  const noInstallFlag = args.includes('--no-install');
  const argPortOffset = parseNumericFlag(args, '--port-offset');
  const argName = args.find(a => !a.startsWith('-') && !isValueOfFlag(args, a))?.trim();

  // Non-interactive mode
  if (yesFlag) {
    const appName = toKebab(argName ?? 'my-mobile-app');
    const destDir = getDestDir(appName);

    console.log('');
    logStep(`Creating "${appName}" (non-interactive)`);

    try {
      await scaffold({
        appName,
        destDir,
        portOffset: argPortOffset ?? 0,
        initGit: !noGitFlag,
      });
    } catch (err) {
      logError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }

    if (!noInstallFlag) {
      const pm = detectDefaultPm();
      const ok = await install(destDir, pm);
      printNextSteps(appName, pm, ok);
    } else {
      printNextSteps(appName, 'yarn', false);
    }
    return;
  }

  // Interactive mode
  const answers = await prompts(
    [
      {
        type: argName ? null : 'text',
        name: 'appName',
        message: 'App name:',
        initial: 'my-mobile-app',
        validate: (v: string) =>
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(toKebab(v)) || 'Must be a valid kebab-case slug',
      },
      {
        type: argPortOffset != null ? null : 'number',
        name: 'portOffset',
        message: 'Port offset (0 = default ports; e.g. 100 → backend at 8100):',
        initial: 0,
        validate: (v: number) => v >= 0 || 'Must be a non-negative integer',
      },
      {
        type: 'select',
        name: 'packageManager',
        message: 'Package manager:',
        choices: buildPmChoices(),
        initial: 0,
      },
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
    },
  );

  const appName = toKebab(argName ?? answers.appName ?? 'my-mobile-app');
  const destDir = getDestDir(appName);
  const portOffset = argPortOffset ?? answers.portOffset ?? 0;

  console.log('');
  logStep(`Creating "${appName}"`);

  try {
    await scaffold({
      appName,
      destDir,
      portOffset,
      initGit: !noGitFlag,
    });
  } catch (err) {
    logError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const pm: PackageManager = answers.packageManager ?? 'yarn';

  if (answers.installDeps ?? true) {
    const ok = await install(destDir, pm);
    printNextSteps(appName, pm, ok);
  } else {
    printNextSteps(appName, pm, false);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printBanner(): void {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log(`  ║   create-tast-mobile-app  v${__PACKAGE_VERSION__}    ║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log('  Expo (React Native) app scaffolder');
  console.log('  From nimoh react-native-base-template');
}

function printHelp(): void {
  console.log(`
  create-tast-mobile-app [name] [options]

  Options:
    --yes, -y         Non-interactive mode (use defaults)
    --no-git          Skip git init
    --no-install      Skip dependency install
    --port-offset <n> Port offset for API URL (default: 0)
    --help, -h        Show this help
    --version, -v     Show version

  Examples:
    npx @nimoh-digital-solutions/create-tast-mobile-app my-app
    npx @nimoh-digital-solutions/create-tast-mobile-app my-app --yes
    npx @nimoh-digital-solutions/create-tast-mobile-app my-app --port-offset 100 --no-git --no-install
`);
}

function printNextSteps(appName: string, pm: string, installed: boolean): void {
  console.log('');
  console.log('  ✅  Your mobile app is ready!\n');
  console.log('  Next steps:\n');
  console.log(`    cd ${appName}`);
  if (!installed) {
    console.log(`    ${pm} install`);
  }
  console.log(`    ${pm === 'npm' ? 'npx' : pm} expo start`);
  console.log('');
  console.log('  Build with EAS:');
  console.log(`    ${pm === 'npm' ? 'npx' : pm} eas build --profile development --platform ios`);
  console.log('');
}

function detectDefaultPm(): PackageManager {
  if (commandExists('yarn')) return 'yarn';
  if (commandExists('pnpm')) return 'pnpm';
  return 'npm';
}

function buildPmChoices(): Array<{ title: string; value: PackageManager }> {
  const pms: Array<{ title: string; value: PackageManager }> = [
    { title: 'yarn', value: 'yarn' },
    { title: 'npm', value: 'npm' },
    { title: 'pnpm', value: 'pnpm' },
  ];
  const detected = pms.filter(p => commandExists(p.value));
  const undetected = pms.filter(p => !commandExists(p.value));
  return [
    ...detected.map(p => ({ ...p, title: `${p.title} ✓` })),
    ...undetected,
  ];
}

function parseNumericFlag(args: string[], flag: string): number | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  const val = Number(args[idx + 1]);
  return Number.isFinite(val) ? val : undefined;
}

function isValueOfFlag(args: string[], value: string): boolean {
  const idx = args.indexOf(value);
  if (idx <= 0) return false;
  const prev = args[idx - 1];
  return prev !== undefined && prev.startsWith('--');
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().catch((err) => {
  logError(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

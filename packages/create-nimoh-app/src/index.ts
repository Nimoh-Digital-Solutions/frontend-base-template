import path from 'path';
import prompts from 'prompts';

declare const __PACKAGE_VERSION__: string;

import { checkPrerequisites } from './prereqs.js';
import { scaffoldBackend } from './backend.js';
import { scaffoldFrontend } from './frontend.js';
import { createRootFiles } from './root-files.js';
import { exec, exists, logError, logOk, logStep, mkdirp, toKebab } from './utils.js';

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  printBanner();

  // 1. Prerequisite checks
  checkPrerequisites();

  // 2. Parse CLI args
  const args = process.argv.slice(2);
  const argName = args.find(a => !a.startsWith('-'))?.trim();

  // 3. Shared prompts
  const answers = await prompts(
    [
      {
        type: argName ? null : 'text',
        name: 'projectName',
        message: 'Project name:',
        initial: 'my-nimoh-app',
        validate: (v: string) =>
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(toKebab(v)) || 'Must be a valid kebab-case slug',
      },
      {
        type: 'number',
        name: 'portOffset',
        message: 'Port offset (0 = default ports; e.g. 100 → BE 8100, FE dev 3100, FE prod 8180):',
        initial: 0,
        validate: (v: number) => v >= 0 || 'Must be a non-negative integer',
      },
    ],
    {
      onCancel: () => {
        console.log('\nOperation cancelled');
        process.exit(0);
      },
    },
  );

  const projectName = toKebab(argName ?? answers.projectName ?? 'my-nimoh-app');
  const portOffset: number = answers.portOffset ?? 0;
  const projectRoot = path.resolve(process.cwd(), projectName);

  // 4. Validate project directory doesn't exist
  if (exists(projectRoot)) {
    logError(`Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  console.log('');
  logStep(`Creating full-stack project "${projectName}"`);

  // 5. Create project root
  mkdirp(projectRoot);

  try {
    // 6. Scaffold backend
    await scaffoldBackend({ projectName, portOffset, projectRoot });

    // 7. Scaffold frontend
    await scaffoldFrontend({ projectName, portOffset, projectRoot });

    // 8. Root-level files (.gitignore, Makefile, .github/, .claude/)
    createRootFiles({ projectName, projectRoot });

    // 9. Git init at project root
    logStep('Initialising git repository');
    initRootGit(projectRoot);

    // 10. Summary
    printSummary(projectName, portOffset);
  } catch (err) {
    logError(err instanceof Error ? err.message : String(err));
    logError('Scaffold failed. The partially created directory has been left for inspection.');
    process.exit(1);
  }
}

// ─── Git init ────────────────────────────────────────────────────────────────

function initRootGit(projectRoot: string): void {
  // Remove any .git dirs that sub-scaffolds may have created
  const fs = require('fs') as typeof import('fs');
  for (const sub of ['backend', 'frontend']) {
    const gitDir = path.join(projectRoot, sub, '.git');
    if (exists(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }
  }

  exec('git init', projectRoot);
  exec('git add -A', projectRoot);
  exec('git commit -m "Initial commit — scaffolded by create-nimoh-app"', projectRoot);
  logOk('Git repository initialised with initial commit');
}

// ─── Banner & Summary ────────────────────────────────────────────────────────

function printBanner(): void {
  console.log('');
  console.log('  ╔═══════════════════════════════════╗');
  console.log(`  ║     create-nimoh-app  v${__PACKAGE_VERSION__}      ║`);
  console.log('  ╚═══════════════════════════════════╝');
  console.log('');
  console.log('  Full-stack project scaffolder');
  console.log('  Django (nimoh-be-django-base) + React (create-tast-app)');
}

function printSummary(projectName: string, portOffset: number): void {
  const bePort = 8000 + portOffset;
  const feDevPort = 3000 + portOffset;

  console.log('');
  console.log('  ╔═══════════════════════════════════════════════════╗');
  console.log('  ║                  All done! 🎉                    ║');
  console.log('  ╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Your project is ready at ./${projectName}/`);
  console.log('');
  console.log('  Structure:');
  console.log(`    ${projectName}/`);
  console.log('      backend/          Django API');
  console.log('        .venv/          Python virtual environment');
  console.log('      frontend/         React app');
  console.log('      .gitignore        Root ignore rules');
  console.log('      Makefile          Root dev commands');
  console.log('      .github/          GitHub config');
  console.log('      .claude/          Claude config');
  console.log('');
  console.log('  Quick start:');
  console.log('');
  console.log('    Backend:');
  console.log(`      cd ${projectName}/backend`);
  console.log('      source .venv/bin/activate');
  console.log('      make up          # docker compose up');
  console.log(`      # → http://localhost:${bePort}`);
  console.log('');
  console.log('    Frontend:');
  console.log(`      cd ${projectName}/frontend`);
  console.log('      yarn dev         # (or npm run dev)');
  console.log(`      # → http://localhost:${feDevPort}`);
  console.log('');
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  logError(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

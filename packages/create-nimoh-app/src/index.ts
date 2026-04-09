import path from 'path';
import prompts from 'prompts';

declare const __PACKAGE_VERSION__: string;

import { checkPrerequisites } from './prereqs.js';
import { scaffoldBackend } from './backend.js';
import { scaffoldFrontend } from './frontend.js';
import { createRootFiles } from './root-files.js';
import { commandExists, exec, execAsync, exists, logError, logInfo, logOk, logStep, mkdirp, toKebab } from './utils.js';
import { createSpinner } from './spinner.js';

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  printBanner();

  // 1. Prerequisite checks
  checkPrerequisites();

  // 2. Parse CLI args
  const args = process.argv.slice(2);
  const argName = args.find(a => !a.startsWith('-'))?.trim();
  const yesMode = args.includes('--yes') || args.includes('-y');
  const aiHelpersFlag = args.includes('--ai-helpers');

  // 3. Shared prompts
  const answers = yesMode
    ? { projectName: argName ?? 'my-nimoh-app', portOffset: 0, aiHelpers: aiHelpersFlag }
    : await prompts(
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
        {
          type: aiHelpersFlag ? null : 'confirm',
          name: 'aiHelpers',
          message: 'Sync AI helper assets (agents, skills, instructions)?',
          initial: false,
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
  const includeAiHelpers: boolean = aiHelpersFlag || (answers.aiHelpers ?? false);
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
    await scaffoldBackend({ projectName, portOffset, projectRoot, nonInteractive: yesMode });

    // 7. Scaffold frontend
    await scaffoldFrontend({ projectName, portOffset, projectRoot, nonInteractive: yesMode });

    // 8. Root-level files (.gitignore, Makefile, README.md, .github/, .claude/)
    createRootFiles({ projectName, portOffset, projectRoot });

    // 9. AI helper assets (opt-in)
    if (includeAiHelpers) {
      await syncAiHelpers(projectRoot);
    }

    // 10. Git init at project root
    logStep('Initialising git repository');
    initRootGit(projectRoot);

    // 11. Summary
    printSummary(projectName, portOffset, includeAiHelpers);
  } catch (err) {
    logError(err instanceof Error ? err.message : String(err));
    logError('Scaffold failed. The partially created directory has been left for inspection.');
    process.exit(1);
  }
}

// ─── AI helpers sync ─────────────────────────────────────────────────────────

const AI_HELPERS_PKG = '@nimoh-digital-solutions/nimoh-ai-helpers';

async function syncAiHelpers(projectRoot: string): Promise<void> {
  logStep('Syncing AI helper assets');

  const spinner = createSpinner('Downloading and syncing helpers');

  const result = await execAsync(
    `npx --yes --package ${AI_HELPERS_PKG} nimoh-ai-helpers-sync ${projectRoot} --with-claude`,
    projectRoot,
  );

  if (result.success) {
    spinner.succeed('AI helpers synced');
  } else {
    spinner.fail('AI helper sync failed');
    logInfo('You can sync manually later:');
    logInfo(`  npx --yes --package ${AI_HELPERS_PKG} nimoh-ai-helpers-sync . --with-claude`);
  }
}

// ─── Git init ────────────────────────────────────────────────────────────────

function initRootGit(projectRoot: string): void {
  if (!commandExists('git')) {
    logInfo('git not found — skipping repository initialisation');
    return;
  }

  // Remove any .git dirs that sub-scaffolds may have created
  const fs = require('fs') as typeof import('fs');
  for (const sub of ['backend', 'frontend']) {
    const gitDir = path.join(projectRoot, sub, '.git');
    if (exists(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }
  }

  const init = exec('git init', projectRoot);
  if (!init.success) {
    logInfo('git init failed — skipping repository initialisation');
    return;
  }

  const add = exec('git add -A', projectRoot);
  if (!add.success) {
    logInfo('git add failed — skipping initial commit');
    return;
  }

  const commit = exec('git commit -m "Initial commit — scaffolded by create-nimoh-app"', projectRoot);
  if (!commit.success) {
    logInfo('git commit failed — repo initialised but no initial commit');
    return;
  }

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

function printSummary(projectName: string, portOffset: number, aiHelpers = false): void {
  const bePort = 8000 + portOffset;
  const feDevPort = 3000 + portOffset;
  const feProdPort = 8080 + portOffset;
  const redisPort = 6379 + portOffset;
  const pgPort = 5432 + portOffset;

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

  if (aiHelpers) {
    console.log('      .github/agents/   AI agent definitions');
    console.log('      .github/skills/   AI skill definitions');
    console.log('      .claude/agents/   AI agents (Claude)');
    console.log('      .claude/skills/   AI skills (Claude)');
  }

  console.log('');
  console.log('  Ports:');
  console.log(`    Django API        http://localhost:${bePort}`);
  console.log(`    React dev         http://localhost:${feDevPort}`);
  console.log(`    React prod        http://localhost:${feProdPort}  (Docker)`);
  console.log(`    PostgreSQL        localhost:${pgPort}`);
  console.log(`    Redis             localhost:${redisPort}`);
  console.log('');
  console.log('  Quick start:');
  console.log('');
  console.log('    Both (from project root):');
  console.log(`      cd ${projectName}`);
  console.log('      make start       # starts BE + FE in parallel');
  console.log('      make stop        # stops both');
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

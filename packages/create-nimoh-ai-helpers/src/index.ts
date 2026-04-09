import path from 'path';

declare const __PACKAGE_VERSION__: string;

import { runSync } from './sync.js';
import { exists, logError, logOk, logStep } from './utils.js';

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  printBanner();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(__PACKAGE_VERSION__);
    process.exit(0);
  }

  const targetArg = args.find((a) => !a.startsWith('-'));
  const targetDir = path.resolve(process.cwd(), targetArg ?? '.');
  const dryRun = args.includes('--dry-run');
  const githubOnly = args.includes('--github-only');

  if (!exists(targetDir)) {
    logError(`Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  const mode = githubOnly ? '.github only' : '.github + .claude';
  logStep(`Syncing AI helpers into ${targetDir} (${mode})`);

  if (dryRun) {
    logStep('Dry-run mode — no files will be written');
  }

  const success = await runSync({ targetDir, githubOnly, dryRun });

  if (!success) {
    logError('Sync failed.');
    process.exit(1);
  }

  if (!dryRun) {
    printSummary(targetDir, githubOnly);
  }
}

// ─── Banner ──────────────────────────────────────────────────────────────────

function printBanner(): void {
  console.log('');
  console.log('  ╔════════════════════════════════════════════╗');
  console.log(`  ║   create-nimoh-ai-helpers  v${__PACKAGE_VERSION__.padEnd(14)}║`);
  console.log('  ╚════════════════════════════════════════════╝');
  console.log('');
  console.log('  Sync AI helper assets into your project');
  console.log('  Agents, skills, instructions, prompts, workflows');
}

// ─── Usage ───────────────────────────────────────────────────────────────────

function printUsage(): void {
  console.log('');
  console.log('  Usage:');
  console.log('    npx @nimoh-digital-solutions/create-nimoh-ai-helpers [target] [options]');
  console.log('');
  console.log('  Arguments:');
  console.log('    target           Target directory (default: current directory)');
  console.log('');
  console.log('  Options:');
  console.log('    --github-only    Only sync into .github (skip .claude)');
  console.log('    --dry-run        Show what would be synced without writing files');
  console.log('    --help, -h       Show this help message');
  console.log('    --version, -v    Show version');
  console.log('');
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function printSummary(targetDir: string, githubOnly: boolean): void {
  console.log('');
  console.log('  ╔════════════════════════════════════════════╗');
  console.log('  ║              All done! 🎉                  ║');
  console.log('  ╚════════════════════════════════════════════╝');
  console.log('');
  console.log('  Synced AI helpers into:');
  console.log('');
  console.log('    .github/');
  console.log('      agents/          Agent definitions');
  console.log('      skills/          Skill definitions');
  console.log('      instructions/    Coding instructions');
  console.log('      prompts/         Prompt templates');
  console.log('      workflows/       CI/CD workflows');
  console.log('      helper-aliases.json');

  if (!githubOnly) {
    console.log('');
    console.log('    .claude/');
    console.log('      agents/          Agent definitions');
    console.log('      skills/          Skill definitions');
    console.log('      instructions/    Coding instructions');
  }

  console.log('');
  console.log('  Next steps:');
  console.log('');
  console.log('    • Review synced files and remove any you don\'t need');
  console.log('    • Commit the helpers to your repository');
  console.log(`    • Re-run this command to update helpers to the latest version`);
  console.log('');
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  logError(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

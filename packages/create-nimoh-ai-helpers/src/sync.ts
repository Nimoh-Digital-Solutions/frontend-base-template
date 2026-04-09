import { execAsync, logError, logInfo } from './utils.js';
import { createSpinner } from './spinner.js';

const HELPERS_PKG = '@nimoh-digital-solutions/nimoh-ai-helpers';

export interface SyncOptions {
  targetDir: string;
  githubOnly: boolean;
  dryRun: boolean;
}

/**
 * Invoke `nimoh-ai-helpers-sync` via npx as a subprocess.
 * Returns true on success, false on failure.
 */
export async function runSync(opts: SyncOptions): Promise<boolean> {
  const args: string[] = [
    '--yes',
    '--package', HELPERS_PKG,
    'nimoh-ai-helpers-sync',
    opts.targetDir,
  ];

  if (!opts.githubOnly) {
    args.push('--with-claude');
  }

  if (opts.dryRun) {
    args.push('--dry-run');
  }

  const label = opts.dryRun
    ? 'Running sync (dry-run)'
    : 'Syncing AI helper assets';

  const spinner = createSpinner(label);

  const result = await execAsync('npx', args, process.cwd());

  if (result.success) {
    spinner.succeed(label);
    if (result.output) {
      for (const line of result.output.split('\n')) {
        logInfo(line);
      }
    }
    return true;
  }

  spinner.fail(label);
  logError(result.error ?? 'Unknown error during sync');
  if (result.output) {
    logError(result.output);
  }
  return false;
}

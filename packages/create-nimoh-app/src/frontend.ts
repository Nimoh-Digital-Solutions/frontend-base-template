import path from 'path';
import { logOk, logStep, logError, spawnInteractive, commandExists } from './utils.js';

export interface FrontendOptions {
  projectName: string;
  portOffset: number;
  projectRoot: string; // absolute path to the top-level project dir
  nonInteractive?: boolean;
}

/**
 * Scaffold the React frontend by invoking create-tast-app.
 * Passes shared values (project name, port offset) as CLI args so the user
 * only answers FE-specific prompts interactively.
 */
export async function scaffoldFrontend(opts: FrontendOptions): Promise<void> {
  const { projectName, portOffset, projectRoot, nonInteractive } = opts;

  logStep('Running create-tast-app (answer the remaining prompts)');
  console.log('');

  // Build the command: npx @nimoh-digital-solutions/create-tast-app <name> --port-offset <n>
  // The app name is passed positionally (create-tast-app picks it up from argv).
  // --port-offset is a new flag we add to create-tast-app.
  const args = [
    '@nimoh-digital-solutions/create-tast-app',
    projectName,
    '--port-offset',
    String(portOffset),
  ];

  if (nonInteractive) {
    args.push('--yes');
  }

  const { code } = await spawnInteractive('npx', args, projectRoot);

  if (code !== 0) {
    throw new Error(`create-tast-app exited with code ${code}`);
  }

  // create-tast-app outputs into a directory named after the app name.
  // Move it into the "frontend" subdirectory.
  const scaffoldedDir = path.join(projectRoot, projectName);
  const frontendDir = path.join(projectRoot, 'frontend');

  // create-tast-app already created the directory with the app name;
  // we just rename it to "frontend"
  const fs = await import('fs');
  if (fs.existsSync(scaffoldedDir)) {
    fs.renameSync(scaffoldedDir, frontendDir);
    logOk(`Renamed ${projectName}/ → frontend/`);
  }

  logOk('Frontend scaffolded');
}

import path from 'path';
import fs from 'fs';
import { createSpinner } from './spinner.js';
import { execAsync, exists, logError, logInfo, logOk, logStep } from './utils.js';

const MOBILE_PKG = '@nimoh-digital-solutions/create-tast-mobile-app';

export interface MobileOptions {
  projectName: string;
  portOffset: number;
  projectRoot: string;
}

/**
 * Scaffold the Expo (React Native) mobile app by invoking create-tast-mobile-app.
 *
 * This step is **non-fatal**: if the mobile scaffold fails the user still gets
 * a working BE + FE project, plus a manual command to retry.
 */
export async function scaffoldMobile(opts: MobileOptions): Promise<boolean> {
  const { projectName, portOffset, projectRoot } = opts;

  logStep('Scaffolding mobile app (Expo / React Native)');

  const spinner = createSpinner('Running create-tast-mobile-app…');

  const cmd = [
    'npx',
    '--yes',
    MOBILE_PKG,
    projectName,
    '--port-offset',
    String(portOffset),
    '--no-git',
    '--no-install',
    '--yes',
  ].join(' ');

  const result = await execAsync(cmd, projectRoot);

  if (!result.success) {
    spinner.fail('Mobile scaffold failed');
    logError(result.error ?? 'unknown error');
    logInfo('You can scaffold the mobile app manually:');
    logInfo(`  cd ${projectRoot}`);
    logInfo(`  npx ${MOBILE_PKG} ${projectName} --port-offset ${portOffset}`);
    logInfo(`  mv ${projectName} mobile`);
    return false;
  }

  spinner.succeed('Mobile app scaffolded');

  // Rename <projectName>/ → mobile/
  const scaffoldedDir = path.join(projectRoot, projectName);
  const mobileDir = path.join(projectRoot, 'mobile');

  if (exists(scaffoldedDir)) {
    fs.renameSync(scaffoldedDir, mobileDir);
    logOk(`Renamed ${projectName}/ → mobile/`);
  }

  return true;
}

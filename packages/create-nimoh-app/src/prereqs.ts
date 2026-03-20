import { exec, commandExists, logOk, logError } from './utils.js';

interface VersionCheck {
  ok: boolean;
  version?: string;
  error?: string;
}

/**
 * Verify that all required tools are available and meet minimum versions.
 * Exits the process with a clear message if anything is missing.
 */
export function checkPrerequisites(): void {
  console.log('');
  console.log('  Checking prerequisites…');

  const git = checkGit();
  const python = checkPython();
  const node = checkNode();
  const npm = checkNpm();

  const allOk = git.ok && python.ok && node.ok && npm.ok;

  if (!allOk) {
    console.log('');
    logError('Missing prerequisites — please install the tools above and try again.');
    process.exit(1);
  }

  console.log('');
}

function checkGit(): VersionCheck {
  if (!commandExists('git')) {
    logError('git is not installed. https://git-scm.com/downloads');
    return { ok: false, error: 'not installed' };
  }
  logOk('git');
  return { ok: true };
}

function checkPython(): VersionCheck {
  // Try python3 first, then python
  const pythonCmd = getPythonCommand();
  if (!pythonCmd) {
    logError('Python ≥3.12 is required but not found. https://www.python.org/downloads/');
    return { ok: false, error: 'not installed' };
  }

  const result = exec(`${pythonCmd} -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"`, process.cwd());
  if (!result.success) {
    logError('Could not determine Python version.');
    return { ok: false, error: 'version check failed' };
  }

  const version = result.output.trim();
  const parts = version.split('.').map(Number);
  const major = parts[0] ?? 0;
  const minor = parts[1] ?? 0;
  if (major < 3 || (major === 3 && minor < 12)) {
    logError(`Python ≥3.12 required, found ${version}`);
    return { ok: false, version, error: 'version too old' };
  }

  logOk(`Python ${version} (${pythonCmd})`);
  return { ok: true, version };
}

function checkNode(): VersionCheck {
  if (!commandExists('node')) {
    logError('Node.js ≥18 is required but not found. https://nodejs.org/');
    return { ok: false, error: 'not installed' };
  }

  const result = exec('node --version', process.cwd());
  if (!result.success) {
    logError('Could not determine Node.js version.');
    return { ok: false, error: 'version check failed' };
  }

  const version = result.output.trim().replace(/^v/, '');
  const major = parseInt(version.split('.')[0] ?? '0', 10);
  if (major < 18) {
    logError(`Node.js ≥18 required, found ${version}`);
    return { ok: false, version, error: 'version too old' };
  }

  logOk(`Node.js ${version}`);
  return { ok: true, version };
}

function checkNpm(): VersionCheck {
  if (!commandExists('npm') && !commandExists('npx')) {
    logError('npm/npx is required but not found (should come with Node.js).');
    return { ok: false, error: 'not installed' };
  }
  logOk('npm/npx');
  return { ok: true };
}

/**
 * Find the Python 3 command available on this system.
 * Returns 'python3' or 'python' or null.
 */
export function getPythonCommand(): string | null {
  // Prefer python3 to avoid accidentally picking up Python 2
  for (const cmd of ['python3', 'python']) {
    const result = exec(
      `${cmd} -c "import sys; exit(0 if sys.version_info >= (3, 12) else 1)"`,
      process.cwd(),
    );
    if (result.success) return cmd;
  }
  return null;
}

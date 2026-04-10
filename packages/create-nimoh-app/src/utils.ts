import { execSync, spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ─── Logging helpers ──────────────────────────────────────────────────────────

export function logStep(msg: string): void {
  console.log(`\n▶ ${msg}`);
}

export function logOk(msg: string): void {
  console.log(`  ✓ ${msg}`);
}

export function logInfo(msg: string): void {
  console.log(`  • ${msg}`);
}

export function logWarn(msg: string): void {
  console.warn(`  ! ${msg}`);
}

export function logError(msg: string): void {
  console.error(`  ✗ ${msg}`);
}

// ─── File helpers ─────────────────────────────────────────────────────────────

export function exists(absPath: string): boolean {
  return fs.existsSync(absPath);
}

export function mkdirp(absPath: string): void {
  fs.mkdirSync(absPath, { recursive: true });
}

export function readText(absPath: string): string {
  return fs.readFileSync(absPath, 'utf-8');
}

export function writeText(absPath: string, content: string): void {
  fs.writeFileSync(absPath, content);
}

// ─── Exec helpers ─────────────────────────────────────────────────────────────

export interface ExecResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Run a shell command synchronously.
 */
export function exec(
  cmd: string,
  cwd: string,
  stdio: 'inherit' | 'pipe' = 'pipe',
): ExecResult {
  try {
    if (stdio === 'inherit') {
      execSync(cmd, { cwd, stdio: 'inherit' });
      return { success: true, output: '' };
    }
    const output = execSync(cmd, { cwd, encoding: 'utf-8' });
    return { success: true, output: output.trim() };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, output: '', error };
  }
}

/**
 * Run a shell command asynchronously (spinners can animate).
 */
export function execAsync(cmd: string, cwd: string): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, { cwd, shell: true, stdio: 'pipe' });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout.trim() });
      } else {
        resolve({
          success: false,
          output: stdout.trim(),
          error: stderr.trim() || `Exit code ${code}`,
        });
      }
    });

    child.on('error', (err) => {
      resolve({ success: false, output: '', error: err.message });
    });
  });
}

/**
 * Spawn a command with full stdio inheritance (user interacts directly).
 * Returns a promise that resolves when the process exits.
 */
export function spawnInteractive(
  cmd: string,
  args: string[],
  cwd: string,
  env?: Record<string, string>,
): Promise<{ code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
      env: env ? { ...process.env, ...env } : process.env,
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 1 });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Check if a command is available on PATH.
 */
export function commandExists(cmd: string): boolean {
  const result = spawnSync(cmd, ['--version'], {
    shell: false,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  return result.status === 0;
}

// ─── String helpers ───────────────────────────────────────────────────────────

/**
 * Sanitise a project name into a filesystem-safe slug.
 * Preserves both hyphens and underscores so the user's intent is kept.
 * e.g. "My Cool App" → "my-cool-app", "my_app" → "my_app"
 */
export function toKebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/[-]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert a kebab-case string to a Python identifier slug.
 * e.g. "my-cool-app" → "my_cool_app"
 */
export function toPythonSlug(name: string): string {
  return toKebab(name).replace(/-/g, '_');
}

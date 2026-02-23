import { execSync, spawnSync } from 'child_process';
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

export function readText(absPath: string): string {
  return fs.readFileSync(absPath, 'utf-8');
}

export function writeText(absPath: string, content: string): void {
  fs.writeFileSync(absPath, content);
}

export function readJson(absPath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(absPath, 'utf-8')) as Record<string, unknown>;
}

export function writeJson(absPath: string, data: unknown): void {
  fs.writeFileSync(absPath, JSON.stringify(data, null, 2) + '\n');
}

export function safeUnlink(absPath: string): boolean {
  if (!exists(absPath)) return false;
  try {
    fs.unlinkSync(absPath);
    return true;
  } catch {
    return false;
  }
}

export function safeRmDir(absDir: string): boolean {
  if (!exists(absDir)) return false;
  try {
    fs.rmSync(absDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

// ─── Exec helpers ─────────────────────────────────────────────────────────────

export interface ExecResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Run a shell command synchronously in the given working directory.
 * Returns success/failure and combined output.
 * Pass `extraEnv` to inject additional environment variables into the subprocess
 * without exposing them to the parent process.
 */
export function exec(
  cmd: string,
  cwd: string,
  stdio: 'inherit' | 'pipe' = 'pipe',
  extraEnv?: Record<string, string>,
): ExecResult {
  const env = extraEnv ? { ...process.env, ...extraEnv } : process.env;
  try {
    if (stdio === 'inherit') {
      execSync(cmd, { cwd, stdio: 'inherit', env });
      return { success: true, output: '' };
    }
    const output = execSync(cmd, { cwd, encoding: 'utf-8', env });
    return { success: true, output: output.trim() };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, output: '', error };
  }
}

/**
 * Resolve a GitHub Packages auth token for @nimoh-digital-solutions/* packages.
 *
 * Resolution order:
 *   1. NPM_TOKEN environment variable (already exported in the shell)
 *   2. `//npm.pkg.github.com/:_authToken=<value>` entry in ~/.npmrc
 *
 * Returns the token string, or an empty string if nothing is found.
 * Never throws — missing auth is handled by callers.
 */
export function resolveNpmToken(): string {
  // 1. Env var — fastest, also used by CI and Docker.
  if (process.env['NPM_TOKEN']) return process.env['NPM_TOKEN'];

  // 2. Parse ~/.npmrc for the GitHub Packages auth line.
  try {
    const npmrcPath = path.join(
      process.env['HOME'] ?? process.env['USERPROFILE'] ?? '',
      '.npmrc',
    );
    if (!fs.existsSync(npmrcPath)) return '';
    const lines = fs.readFileSync(npmrcPath, 'utf-8').split('\n');
    for (const line of lines) {
      // Matches: //npm.pkg.github.com/:_authToken=<token>
      // RegExp constructor avoids the // regex literal ambiguity parsed by bundlers.
      const match = line.match(new RegExp('^//npm\\.pkg\\.github\\.com/:_authToken=(.+)$'));
      if (match && match[1]?.trim()) return match[1].trim();
    }
  } catch {
    // Ignore read errors — caller handles missing token.
  }

  return '';
}

/**
 * Check if a command is available on PATH.
 */
export function commandExists(cmd: string): boolean {
  const result = spawnSync(cmd, ['--version'], { shell: false, encoding: 'utf-8' });
  return result.status === 0;
}

// ─── String helpers ───────────────────────────────────────────────────────────

/**
 * Convert a string to a valid npm package name.
 * e.g. "My Cool App" → "my-cool-app"
 */
export function toPackageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert a package name / kebab-case string to a title.
 * e.g. "my-cool-app" → "My Cool App"
 */
export function toTitle(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Remove a marked optional section from content.
 * Markers: <!-- OPTIONAL:MARKER:START --> ... <!-- OPTIONAL:MARKER:END -->
 */
export function removeMarkedSection(content: string, marker: string): string {
  const startComment = `<!-- OPTIONAL:${marker}:START -->`;
  const endComment = `<!-- OPTIONAL:${marker}:END -->`;
  const escaped = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `\\n?${escaped(startComment)}[\\s\\S]*?${escaped(endComment)}\\n?`,
    'g'
  );
  return content.replace(regex, '\n');
}

/**
 * Path to the project root (where this CLI was invoked from).
 */
export function getDestDir(appName: string): string {
  return path.resolve(process.cwd(), appName);
}

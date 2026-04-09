import { execSync, spawn } from 'child_process';
import fs from 'fs';

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

// ─── Exec helpers ─────────────────────────────────────────────────────────────

export interface ExecResult {
  success: boolean;
  output: string;
  error?: string;
}

export function execAsync(cmd: string, args: string[], cwd: string): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: true, stdio: 'pipe' });
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

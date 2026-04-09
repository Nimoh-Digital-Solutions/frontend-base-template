/**
 * Lightweight inline spinner — zero dependencies.
 *
 * Uses Braille-dot frames and writes directly to stderr so it doesn't
 * interfere with piped stdout.
 */

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const INTERVAL_MS = 80;

export interface Spinner {
  succeed(msg?: string): void;
  fail(msg?: string): void;
  stop(): void;
}

export function createSpinner(text: string): Spinner {
  let frame = 0;

  const id = setInterval(() => {
    const symbol = FRAMES[frame++ % FRAMES.length];
    process.stderr.write(`\r\x1b[K  ${symbol} ${text}`);
  }, INTERVAL_MS);

  process.stderr.write(`\r\x1b[K  ${FRAMES[0]} ${text}`);

  return {
    succeed(msg?: string) {
      clearInterval(id);
      process.stderr.write(`\r\x1b[K  ✓ ${msg ?? text}\n`);
    },
    fail(msg?: string) {
      clearInterval(id);
      process.stderr.write(`\r\x1b[K  ✗ ${msg ?? text}\n`);
    },
    stop() {
      clearInterval(id);
      process.stderr.write('\r\x1b[K');
    },
  };
}

/**
 * Lightweight inline spinner — zero dependencies.
 *
 * Uses Braille-dot frames and writes directly to stderr so it doesn't
 * interfere with piped stdout.  The spinner animates on the event loop,
 * so it must be paired with async operations (see `execAsync` in utils.ts).
 */

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const INTERVAL_MS = 80;

export interface Spinner {
  /** Stop the spinner and show a success (✓) message. */
  succeed(msg?: string): void;
  /** Stop the spinner and show a failure (✗) message. */
  fail(msg?: string): void;
  /** Stop the spinner silently (clears the line). */
  stop(): void;
}

/**
 * Create and immediately start an animated spinner.
 *
 * @example
 * ```ts
 * const spin = createSpinner('Cloning template');
 * await execAsync('git clone …', cwd);
 * spin.succeed('Template cloned');
 * ```
 */
export function createSpinner(text: string): Spinner {
  let frame = 0;

  const id = setInterval(() => {
    const symbol = FRAMES[frame++ % FRAMES.length];
    process.stderr.write(`\r\x1b[K  ${symbol} ${text}`);
  }, INTERVAL_MS);

  // Write the first frame immediately so the user sees something instantly
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

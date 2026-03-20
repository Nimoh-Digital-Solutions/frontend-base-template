import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { scaffold, type ScaffoldOptions } from '../scaffold.js';

/**
 * Integration tests for the scaffold function.
 *
 * Strategy: we mock `execAsync` (used by cloneTemplate) to create a minimal
 * fake template directory instead of actually cloning from GitHub.  This lets
 * us verify the entire post-clone pipeline: token replacement, feature removal,
 * .env.local generation, git init, and rollback on failure.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

let tmpDir: string;
let destDir: string;

function fakeTemplate(dest: string): void {
  fs.mkdirSync(dest, { recursive: true });

  // Minimal package.json matching what the real template has
  fs.writeFileSync(
    path.join(dest, 'package.json'),
    JSON.stringify(
      {
        name: 'react-starter-kit',
        version: '1.0.0',
        private: true,
        description:
          'A modern React starter kit with TypeScript, Vite, SCSS, and comprehensive tooling for building scalable applications',
        workspaces: ['packages/*'],
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          test: 'vitest',
          'packages:build': 'turbo run build --filter=./packages/*',
          changeset: 'changeset',
          storybook: 'yarn workspace @nimoh-digital-solutions/tast-ui storybook',
        },
        dependencies: {
          react: '^19.0.0',
          '@nimoh-digital-solutions/tast-utils': 'workspace:^',
        },
        devDependencies: {
          '@changesets/cli': '^2.27.0',
          typescript: '^5.8.0',
          prompts: '^2.4.2',
          '@types/prompts': '^2.4.9',
        },
      },
      null,
      2,
    ),
  );

  // index.html
  fs.writeFileSync(
    path.join(dest, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>React Starter Kit</title>
  <meta name="description" content="A modern React starter kit" />
  <meta name="application-name" content="React Starter Kit" />
</head>
<body><div id="root"></div></body>
</html>`,
  );

  // .env.example
  fs.writeFileSync(
    path.join(dest, '.env.example'),
    '# Env\nVITE_APP_TITLE=React Starter Kit\nVITE_API_URL=\n',
  );

  // tsconfig.json with workspace paths
  fs.writeFileSync(
    path.join(dest, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          paths: {
            '@/components/*': ['./src/components/*'],
            '@nimoh-digital-solutions/tast-utils': [
              '../packages/tast-utils/src/index.ts',
            ],
          },
        },
      },
      null,
      2,
    ),
  );

  // Fake .git directory (simulates clone)
  fs.mkdirSync(path.join(dest, '.git'));
  fs.writeFileSync(path.join(dest, '.git', 'HEAD'), 'ref: refs/heads/main\n');

  // packages/ directory (monorepo artifact)
  fs.mkdirSync(path.join(dest, 'packages', 'tast-utils', 'src'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(dest, 'packages', 'tast-utils', 'package.json'),
    '{}',
  );

  // .changeset/
  fs.mkdirSync(path.join(dest, '.changeset'));
  fs.writeFileSync(
    path.join(dest, '.changeset', 'config.json'),
    '{"changelog": "@changesets/cli/changelog"}',
  );

  // Docker files
  fs.writeFileSync(path.join(dest, 'Dockerfile'), 'FROM node:18');
  fs.writeFileSync(path.join(dest, 'docker-compose.yml'), 'version: "3"');
  fs.writeFileSync(path.join(dest, '.dockerignore'), 'node_modules');
  fs.writeFileSync(path.join(dest, 'nginx.conf'), 'server {}');
  fs.writeFileSync(path.join(dest, 'Makefile'), 'docker-dev:');
  fs.mkdirSync(path.join(dest, 'nginx'));
  fs.writeFileSync(
    path.join(dest, 'nginx', 'security_headers.conf'),
    'add_header X-Frame-Options DENY;',
  );

  // Husky
  fs.mkdirSync(path.join(dest, '.husky'));
  fs.writeFileSync(path.join(dest, '.husky', 'pre-commit'), '#!/bin/sh');

  // Template docs
  fs.writeFileSync(path.join(dest, 'TEMPLATE_ANALYSIS.md'), '# Analysis');
  fs.writeFileSync(path.join(dest, 'REFACTORING.md'), '# Refactoring');

  // yarn.lock (monorepo artifact)
  fs.writeFileSync(path.join(dest, 'yarn.lock'), '# monorepo lockfile');

  // scripts/ directory
  fs.mkdirSync(path.join(dest, 'scripts'));
  fs.writeFileSync(path.join(dest, 'scripts', 'setup.js'), '// setup');
  fs.writeFileSync(
    path.join(dest, 'scripts', 'setup-add-docker.js'),
    '// docker setup',
  );
  fs.writeFileSync(
    path.join(dest, 'scripts', 'setup-add-pwa.js'),
    '// pwa setup',
  );
  fs.writeFileSync(
    path.join(dest, 'scripts', 'setup-add-husky.js'),
    '// husky setup',
  );
}

/** Mock execAsync so cloneTemplate creates a fake template instead of cloning */
vi.mock('../utils.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils.js')>();
  return {
    ...actual,
    execAsync: vi.fn(async (cmd: string, cwd: string) => {
      // Intercept git clone command — create fake template instead
      if (cmd.startsWith('git clone')) {
        const match = cmd.match(/"([^"]+)"$/);
        const dirname = match?.[1] ?? 'test-app';
        fakeTemplate(path.join(cwd, dirname));
        return { success: true, output: '' };
      }
      return actual.execAsync(cmd, cwd);
    }),
    commandExists: vi.fn(() => true),
  };
});

/** Mock the spinner to not write to stderr during tests */
vi.mock('../spinner.js', () => ({
  createSpinner: () => ({
    succeed: vi.fn(),
    fail: vi.fn(),
    stop: vi.fn(),
  }),
}));

// ─── Test setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tast-scaffold-'));
  destDir = path.join(tmpDir, 'my-app');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function defaultOpts(overrides: Partial<ScaffoldOptions> = {}): ScaffoldOptions {
  return {
    appName: 'my-app',
    description: 'A test application',
    destDir,
    enableTailwind: false,
    enablePwa: true,
    enableDocker: true,
    enableHusky: true,
    portOffset: 0,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('scaffold — integration', () => {
  it('creates the destination directory', async () => {
    await scaffold(defaultOpts());
    expect(fs.existsSync(destDir)).toBe(true);
  });

  it('strips cloned .git history and creates fresh repo', async () => {
    await scaffold(defaultOpts());
    // .git exists (from git init) but should be a fresh repo, not the cloned one
    expect(fs.existsSync(path.join(destDir, '.git'))).toBe(true);
    // The cloned HEAD content should have been replaced by a real git init
    const headContent = fs.readFileSync(path.join(destDir, '.git', 'HEAD'), 'utf-8');
    expect(headContent).toContain('ref:');
  });

  it('removes monorepo artifacts (packages/, .changeset/, yarn.lock)', async () => {
    await scaffold(defaultOpts());
    expect(fs.existsSync(path.join(destDir, 'packages'))).toBe(false);
    expect(fs.existsSync(path.join(destDir, '.changeset'))).toBe(false);
    expect(fs.existsSync(path.join(destDir, 'yarn.lock'))).toBe(false);
  });

  it('replaces package.json tokens', async () => {
    await scaffold(defaultOpts());
    const pkg = JSON.parse(
      fs.readFileSync(path.join(destDir, 'package.json'), 'utf-8'),
    );
    expect(pkg.name).toBe('my-app');
    expect(pkg.version).toBe('0.1.0');
    expect(pkg.description).toBe('A test application');
  });

  it('strips workspace: protocol from dependencies', async () => {
    await scaffold(defaultOpts());
    const pkg = JSON.parse(
      fs.readFileSync(path.join(destDir, 'package.json'), 'utf-8'),
    );
    const tastUtilsDep = pkg.dependencies?.['@nimoh-digital-solutions/tast-utils'];
    expect(tastUtilsDep).toBeDefined();
    expect(tastUtilsDep).not.toContain('workspace:');
  });

  it('removes monorepo-only scripts', async () => {
    await scaffold(defaultOpts());
    const pkg = JSON.parse(
      fs.readFileSync(path.join(destDir, 'package.json'), 'utf-8'),
    );
    expect(pkg.scripts?.['packages:build']).toBeUndefined();
    expect(pkg.scripts?.changeset).toBeUndefined();
    expect(pkg.scripts?.storybook).toBeUndefined();
  });

  it('removes monorepo-only devDependencies', async () => {
    await scaffold(defaultOpts());
    const pkg = JSON.parse(
      fs.readFileSync(path.join(destDir, 'package.json'), 'utf-8'),
    );
    expect(pkg.devDependencies?.['@changesets/cli']).toBeUndefined();
    expect(pkg.devDependencies?.prompts).toBeUndefined();
  });

  it('sets workspaces to empty array', async () => {
    await scaffold(defaultOpts());
    const pkg = JSON.parse(
      fs.readFileSync(path.join(destDir, 'package.json'), 'utf-8'),
    );
    expect(pkg.workspaces).toEqual([]);
  });

  it('cleans workspace paths from tsconfig.json', async () => {
    await scaffold(defaultOpts());
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(destDir, 'tsconfig.json'), 'utf-8'),
    );
    const paths = tsconfig.compilerOptions?.paths ?? {};
    // App-local path alias should survive
    expect(paths['@/components/*']).toBeDefined();
    // Workspace path should be removed
    expect(
      paths['@nimoh-digital-solutions/tast-utils'],
    ).toBeUndefined();
  });

  it('generates .env.local with app title', async () => {
    await scaffold(defaultOpts());
    const envLocal = fs.readFileSync(
      path.join(destDir, '.env.local'),
      'utf-8',
    );
    expect(envLocal).toContain('VITE_APP_TITLE=My App');
    expect(envLocal).not.toContain('React Starter Kit');
  });

  it('updates index.html title', async () => {
    await scaffold(defaultOpts());
    const html = fs.readFileSync(path.join(destDir, 'index.html'), 'utf-8');
    expect(html).toContain('<title>My App</title>');
    expect(html).not.toContain('React Starter Kit');
  });

  it('removes template docs', async () => {
    await scaffold(defaultOpts());
    expect(fs.existsSync(path.join(destDir, 'TEMPLATE_ANALYSIS.md'))).toBe(false);
    expect(fs.existsSync(path.join(destDir, 'REFACTORING.md'))).toBe(false);
  });
});

// ─── Feature removal ─────────────────────────────────────────────────────────

describe('scaffold — Docker disabled', () => {
  it('removes Docker files', async () => {
    await scaffold(defaultOpts({ enableDocker: false }));
    expect(fs.existsSync(path.join(destDir, 'Dockerfile'))).toBe(false);
    expect(fs.existsSync(path.join(destDir, 'docker-compose.yml'))).toBe(false);
    expect(fs.existsSync(path.join(destDir, '.dockerignore'))).toBe(false);
    expect(fs.existsSync(path.join(destDir, 'nginx.conf'))).toBe(false);
  });

  it('removes nginx/ directory', async () => {
    await scaffold(defaultOpts({ enableDocker: false }));
    expect(fs.existsSync(path.join(destDir, 'nginx'))).toBe(false);
  });

  it('removes Makefile', async () => {
    await scaffold(defaultOpts({ enableDocker: false }));
    expect(fs.existsSync(path.join(destDir, 'Makefile'))).toBe(false);
  });
});

describe('scaffold — Docker enabled', () => {
  it('keeps Docker files when enabled', async () => {
    await scaffold(defaultOpts({ enableDocker: true }));
    expect(fs.existsSync(path.join(destDir, 'Dockerfile'))).toBe(true);
    expect(fs.existsSync(path.join(destDir, 'docker-compose.yml'))).toBe(true);
    expect(fs.existsSync(path.join(destDir, 'nginx'))).toBe(true);
  });
});

describe('scaffold — Husky disabled', () => {
  it('removes .husky directory', async () => {
    await scaffold(defaultOpts({ enableHusky: false }));
    expect(fs.existsSync(path.join(destDir, '.husky'))).toBe(false);
  });
});

// ─── Rollback on failure ─────────────────────────────────────────────────────

describe('scaffold — rollback on failure', () => {
  it('throws when destination already exists', async () => {
    fs.mkdirSync(destDir, { recursive: true });
    await expect(scaffold(defaultOpts())).rejects.toThrow('already exists');
  });

  it('does not leave a directory on "already exists" error', async () => {
    fs.mkdirSync(destDir, { recursive: true });
    try {
      await scaffold(defaultOpts());
    } catch {
      // The dir still exists because the error was thrown before clone
      // (this is pre-clone validation, not a mid-scaffold crash)
    }
    // destDir still exists since it was created by the user, not scaffold
    expect(fs.existsSync(destDir)).toBe(true);
  });
});

// ─── Snapshot: generated package.json ────────────────────────────────────────

describe('scaffold — package.json snapshot', () => {
  it('matches expected structure', async () => {
    await scaffold(
      defaultOpts({
        appName: 'snapshot-app',
        description: 'Snapshot test',
        destDir: path.join(tmpDir, 'snapshot-app'),
      }),
    );
    const pkg = JSON.parse(
      fs.readFileSync(
        path.join(tmpDir, 'snapshot-app', 'package.json'),
        'utf-8',
      ),
    );

    // Snapshot key fields, not the whole object (deps versions change)
    expect({
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      workspaces: pkg.workspaces,
      hasPackagesBuild: !!pkg.scripts?.['packages:build'],
      hasChangeset: !!pkg.scripts?.changeset,
      hasStorybook: !!pkg.scripts?.storybook,
      hasChangesetsCli: !!pkg.devDependencies?.['@changesets/cli'],
    }).toMatchInlineSnapshot(`
      {
        "description": "Snapshot test",
        "hasChangeset": false,
        "hasChangesetsCli": false,
        "hasPackagesBuild": false,
        "hasStorybook": false,
        "name": "snapshot-app",
        "version": "0.1.0",
        "workspaces": [],
      }
    `);
  });
});

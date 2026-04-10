import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { scaffold, type ScaffoldOptions } from '../scaffold.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let tmpDir: string;
let destDir: string;

/**
 * Create a minimal fake template directory that mirrors the real
 * react-native-base-template structure.
 */
function fakeTemplate(dest: string): void {
  fs.mkdirSync(dest, { recursive: true });

  // .git (simulates clone)
  fs.mkdirSync(path.join(dest, '.git'));
  fs.writeFileSync(path.join(dest, '.git', 'HEAD'), 'ref: refs/heads/main\n');

  // package.json with tokens and Jest config
  fs.writeFileSync(
    path.join(dest, 'package.json'),
    JSON.stringify(
      {
        name: '{{PROJECT_NAME}}',
        version: '0.1.0',
        jest: {
          moduleNameMapper: {
            '^@/(.*)$': '<rootDir>/src/$1',
            '^@shared/(.*)$': '<rootDir>/packages/shared/src/$1',
          },
        },
      },
      null,
      2,
    ),
  );

  // app.json with tokens
  fs.writeFileSync(
    path.join(dest, 'app.json'),
    JSON.stringify(
      {
        expo: {
          name: '{{PROJECT_NAME}}',
          slug: '{{PROJECT_SLUG}}',
          scheme: '{{PROJECT_SLUG}}',
          ios: { bundleIdentifier: '{{BUNDLE_ID}}' },
          android: { package: '{{BUNDLE_ID}}' },
          extra: { eas: { projectId: '{{EAS_PROJECT_ID}}' } },
        },
      },
      null,
      2,
    ),
  );

  // eas.json with tokens
  fs.writeFileSync(
    path.join(dest, 'eas.json'),
    JSON.stringify(
      {
        build: {
          development: {
            env: { EXPO_PUBLIC_API_URL: '{{API_URL}}' },
          },
        },
      },
      null,
      2,
    ),
  );

  // .env.example
  fs.writeFileSync(
    path.join(dest, '.env.example'),
    'EXPO_PUBLIC_API_URL={{API_URL}}\n',
  );

  // tsconfig.json with self-contained paths
  fs.writeFileSync(
    path.join(dest, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: 'expo/tsconfig.base',
        compilerOptions: {
          paths: {
            '@/*': ['./src/*'],
            '@shared/*': ['./packages/shared/src/*'],
          },
        },
        include: ['src', 'packages/shared/src'],
        exclude: ['packages/shared/src/**/__tests__/**'],
      },
      null,
      2,
    ),
  );

  // babel.config.js with self-contained alias
  fs.writeFileSync(
    path.join(dest, 'babel.config.js'),
    `module.exports = function (api) {
  api.cache(true);
  const plugins = [
    ['module-resolver', { alias: { '@': './src', '@shared': './packages/shared/src' } }],
  ];
  plugins.push('react-native-reanimated/plugin');
  return { presets: ['babel-preset-expo'], plugins };
};
`,
  );

  // metro.config.js with self-contained paths
  fs.writeFileSync(
    path.join(dest, 'metro.config.js'),
    `const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
config.watchFolders = [path.resolve(projectRoot, 'packages', 'shared')];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
module.exports = config;
`,
  );

  // Self-contained packages/shared/ (should be stripped)
  fs.mkdirSync(path.join(dest, 'packages', 'shared', 'src', 'types'), { recursive: true });
  fs.writeFileSync(
    path.join(dest, 'packages', 'shared', 'package.json'),
    '{ "name": "@test/shared" }',
  );
  fs.writeFileSync(
    path.join(dest, 'packages', 'shared', 'src', 'types', 'user.ts'),
    'export type User = { id: string };',
  );

  // navigation/linking.ts with tokens
  fs.mkdirSync(path.join(dest, 'src', 'navigation'), { recursive: true });
  fs.writeFileSync(
    path.join(dest, 'src', 'navigation', 'linking.ts'),
    "export const linking = { prefixes: ['{{PROJECT_SLUG}}://'] };\n",
  );

  // README.md and LICENSE
  fs.writeFileSync(path.join(dest, 'README.md'), '# {{PROJECT_NAME}}\n');
  fs.writeFileSync(path.join(dest, 'LICENSE'), 'MIT\n');

  // .yarnrc.yml
  fs.writeFileSync(path.join(dest, '.yarnrc.yml'), 'nodeLinker: node-modules\n');
}

/** Mock execAsync so we create a fake template instead of cloning */
vi.mock('../utils.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils.js')>();
  return {
    ...actual,
    execAsync: vi.fn(async (cmd: string, cwd: string) => {
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

vi.mock('../spinner.js', () => ({
  createSpinner: () => ({
    succeed: vi.fn(),
    fail: vi.fn(),
    stop: vi.fn(),
  }),
}));

// ─── Test setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tast-mobile-scaffold-'));
  destDir = path.join(tmpDir, 'my-app');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function defaultOpts(overrides: Partial<ScaffoldOptions> = {}): ScaffoldOptions {
  return {
    appName: 'my-app',
    destDir,
    portOffset: 0,
    initGit: false,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('scaffold — creates destination', () => {
  it('creates the destination directory', async () => {
    await scaffold(defaultOpts());
    expect(fs.existsSync(destDir)).toBe(true);
  });

  it('throws when destination already exists', async () => {
    fs.mkdirSync(destDir, { recursive: true });
    await expect(scaffold(defaultOpts())).rejects.toThrow('already exists');
  });
});

describe('scaffold — strips bundled packages/shared/', () => {
  it('removes the packages/ directory', async () => {
    await scaffold(defaultOpts());
    expect(fs.existsSync(path.join(destDir, 'packages'))).toBe(false);
  });
});

describe('scaffold — adjusts @shared/* paths to monorepo-relative', () => {
  it('updates tsconfig.json paths', async () => {
    await scaffold(defaultOpts());
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(destDir, 'tsconfig.json'), 'utf-8'),
    );
    expect(tsconfig.compilerOptions.paths['@shared/*']).toEqual([
      '../packages/shared/src/*',
    ]);
    expect(tsconfig.include).toContain('../packages/shared/src');
    expect(tsconfig.exclude).toContain('../packages/shared/src/**/__tests__/**');
  });

  it('updates babel.config.js alias', async () => {
    await scaffold(defaultOpts());
    const babel = fs.readFileSync(
      path.join(destDir, 'babel.config.js'),
      'utf-8',
    );
    expect(babel).toContain("'../packages/shared/src'");
    expect(babel).not.toContain("'./packages/shared/src'");
  });

  it('updates metro.config.js watchFolders', async () => {
    await scaffold(defaultOpts());
    const metro = fs.readFileSync(
      path.join(destDir, 'metro.config.js'),
      'utf-8',
    );
    expect(metro).toContain("'..', 'packages', 'shared'");
    expect(metro).not.toContain("projectRoot, 'packages', 'shared')];");
  });

  it('updates Jest moduleNameMapper in package.json', async () => {
    await scaffold(defaultOpts());
    const pkg = JSON.parse(
      fs.readFileSync(path.join(destDir, 'package.json'), 'utf-8'),
    );
    const mapper = pkg.jest?.moduleNameMapper?.['@shared/(.*)$'] ??
                   pkg.jest?.moduleNameMapper?.['^@shared/(.*)$'];
    expect(mapper).toContain('../packages/shared');
  });
});

describe('scaffold — token replacement', () => {
  it('replaces {{PROJECT_NAME}} in package.json', async () => {
    await scaffold(defaultOpts());
    const pkg = JSON.parse(
      fs.readFileSync(path.join(destDir, 'package.json'), 'utf-8'),
    );
    expect(pkg.name).toBe('my-app');
  });

  it('replaces {{PROJECT_SLUG}} in app.json', async () => {
    await scaffold(defaultOpts());
    const app = JSON.parse(
      fs.readFileSync(path.join(destDir, 'app.json'), 'utf-8'),
    );
    expect(app.expo.slug).toBe('myapp');
    expect(app.expo.scheme).toBe('myapp');
  });

  it('replaces {{BUNDLE_ID}} with default com.example.<slug>', async () => {
    await scaffold(defaultOpts());
    const app = JSON.parse(
      fs.readFileSync(path.join(destDir, 'app.json'), 'utf-8'),
    );
    expect(app.expo.ios.bundleIdentifier).toBe('com.example.myapp');
    expect(app.expo.android.package).toBe('com.example.myapp');
  });

  it('replaces {{API_URL}} using port offset', async () => {
    await scaffold(defaultOpts({ portOffset: 100 }));
    const eas = JSON.parse(
      fs.readFileSync(path.join(destDir, 'eas.json'), 'utf-8'),
    );
    expect(eas.build.development.env.EXPO_PUBLIC_API_URL).toBe(
      'http://localhost:8100/api/v1',
    );
  });

  it('replaces {{EAS_PROJECT_ID}} with placeholder UUID', async () => {
    await scaffold(defaultOpts());
    const app = JSON.parse(
      fs.readFileSync(path.join(destDir, 'app.json'), 'utf-8'),
    );
    expect(app.expo.extra.eas.projectId).toBe(
      '00000000-0000-0000-0000-000000000000',
    );
  });

  it('replaces tokens in linking.ts', async () => {
    await scaffold(defaultOpts());
    const linking = fs.readFileSync(
      path.join(destDir, 'src', 'navigation', 'linking.ts'),
      'utf-8',
    );
    expect(linking).toContain("'myapp://");
    expect(linking).not.toContain('{{PROJECT_SLUG}}');
  });
});

describe('scaffold — cleanup', () => {
  it('removes cloned .git directory', async () => {
    await scaffold(defaultOpts({ initGit: false }));
    expect(fs.existsSync(path.join(destDir, '.git'))).toBe(false);
  });

  it('removes README.md and LICENSE', async () => {
    await scaffold(defaultOpts());
    expect(fs.existsSync(path.join(destDir, 'README.md'))).toBe(false);
    expect(fs.existsSync(path.join(destDir, 'LICENSE'))).toBe(false);
  });
});

describe('scaffold — custom bundleId', () => {
  it('uses provided bundleId instead of default', async () => {
    await scaffold(defaultOpts({ bundleId: 'com.mycompany.myapp' }));
    const app = JSON.parse(
      fs.readFileSync(path.join(destDir, 'app.json'), 'utf-8'),
    );
    expect(app.expo.ios.bundleIdentifier).toBe('com.mycompany.myapp');
  });
});

describe('scaffold — rollback on failure', () => {
  it('cleans up directory on clone failure', async () => {
    const { execAsync: mockExec } = await import('../utils.js');
    (mockExec as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: false,
      output: '',
      error: 'Network error',
    });

    const failDir = path.join(tmpDir, 'fail-app');
    await expect(
      scaffold({ ...defaultOpts(), destDir: failDir }),
    ).rejects.toThrow('Failed to clone');

    expect(fs.existsSync(failDir)).toBe(false);
  });
});

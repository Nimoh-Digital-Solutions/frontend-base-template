import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  toPackageName,
  toTitle,
  removeMarkedSection,
  exists,
  readText,
  writeText,
  readJson,
  writeJson,
  safeUnlink,
  safeRmDir,
  getDestDir,
} from '../utils.js';

// ─── Temp directory helpers ──────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tast-utils-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── toPackageName ───────────────────────────────────────────────────────────

describe('toPackageName', () => {
  it('converts spaces to hyphens', () => {
    expect(toPackageName('My Cool App')).toBe('my-cool-app');
  });

  it('lowercases everything', () => {
    expect(toPackageName('FooBar')).toBe('foobar');
  });

  it('collapses consecutive hyphens', () => {
    expect(toPackageName('a--b---c')).toBe('a-b-c');
  });

  it('strips leading and trailing hyphens', () => {
    expect(toPackageName('-hello-')).toBe('hello');
  });

  it('handles special characters', () => {
    expect(toPackageName('My App @2.0!')).toBe('my-app-2-0');
  });

  it('returns empty string for empty input', () => {
    expect(toPackageName('')).toBe('');
  });

  it('handles already-valid names', () => {
    expect(toPackageName('my-app')).toBe('my-app');
  });
});

// ─── toTitle ─────────────────────────────────────────────────────────────────

describe('toTitle', () => {
  it('converts kebab-case to title case', () => {
    expect(toTitle('my-cool-app')).toBe('My Cool App');
  });

  it('converts underscore-separated strings', () => {
    expect(toTitle('hello_world')).toBe('Hello World');
  });

  it('handles single word', () => {
    expect(toTitle('app')).toBe('App');
  });

  it('handles mixed separators', () => {
    expect(toTitle('my-app_name test')).toBe('My App Name Test');
  });
});

// ─── removeMarkedSection ─────────────────────────────────────────────────────

describe('removeMarkedSection', () => {
  it('removes a marked section', () => {
    const content = [
      'before',
      '<!-- OPTIONAL:PWA:START -->',
      'pwa stuff',
      '<!-- OPTIONAL:PWA:END -->',
      'after',
    ].join('\n');

    const result = removeMarkedSection(content, 'PWA');
    expect(result).toContain('before');
    expect(result).toContain('after');
    expect(result).not.toContain('pwa stuff');
    expect(result).not.toContain('OPTIONAL:PWA');
  });

  it('removes multiple sections with the same marker', () => {
    const content = [
      'a',
      '<!-- OPTIONAL:FOO:START -->',
      'first',
      '<!-- OPTIONAL:FOO:END -->',
      'b',
      '<!-- OPTIONAL:FOO:START -->',
      'second',
      '<!-- OPTIONAL:FOO:END -->',
      'c',
    ].join('\n');

    const result = removeMarkedSection(content, 'FOO');
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).toContain('c');
    expect(result).not.toContain('first');
    expect(result).not.toContain('second');
  });

  it('returns content unchanged when marker is not found', () => {
    const content = 'no markers here';
    expect(removeMarkedSection(content, 'MISSING')).toBe(content);
  });
});

// ─── File helpers ────────────────────────────────────────────────────────────

describe('exists', () => {
  it('returns true for existing file', () => {
    const file = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(file, 'hello');
    expect(exists(file)).toBe(true);
  });

  it('returns false for non-existing file', () => {
    expect(exists(path.join(tmpDir, 'nope.txt'))).toBe(false);
  });
});

describe('readText / writeText', () => {
  it('round-trips text content', () => {
    const file = path.join(tmpDir, 'hello.txt');
    writeText(file, 'hello world');
    expect(readText(file)).toBe('hello world');
  });
});

describe('readJson / writeJson', () => {
  it('round-trips JSON content', () => {
    const file = path.join(tmpDir, 'data.json');
    const data = { name: 'test', version: '1.0.0', nested: { a: 1 } };
    writeJson(file, data);
    expect(readJson(file)).toEqual(data);
  });

  it('formats with 2-space indent and trailing newline', () => {
    const file = path.join(tmpDir, 'format.json');
    writeJson(file, { a: 1 });
    const raw = fs.readFileSync(file, 'utf-8');
    expect(raw).toBe('{\n  "a": 1\n}\n');
  });
});

describe('safeUnlink', () => {
  it('deletes an existing file and returns true', () => {
    const file = path.join(tmpDir, 'delete-me.txt');
    fs.writeFileSync(file, 'bye');
    expect(safeUnlink(file)).toBe(true);
    expect(fs.existsSync(file)).toBe(false);
  });

  it('returns false for non-existing file', () => {
    expect(safeUnlink(path.join(tmpDir, 'nope.txt'))).toBe(false);
  });
});

describe('safeRmDir', () => {
  it('deletes an existing directory recursively and returns true', () => {
    const dir = path.join(tmpDir, 'sub');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'file.txt'), 'data');
    expect(safeRmDir(dir)).toBe(true);
    expect(fs.existsSync(dir)).toBe(false);
  });

  it('returns false for non-existing directory', () => {
    expect(safeRmDir(path.join(tmpDir, 'nope'))).toBe(false);
  });
});

// ─── getDestDir ──────────────────────────────────────────────────────────────

describe('getDestDir', () => {
  it('resolves relative to cwd', () => {
    const result = getDestDir('my-app');
    expect(result).toBe(path.resolve(process.cwd(), 'my-app'));
  });
});

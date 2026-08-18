import assert from 'node:assert';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { test } from 'node:test';
import {
  buildSourceTree,
  extractSourceDeclarations,
  sourceFileResponse,
} from '@/features/app-shell/documentation/sourceCatalog';
import type {
  SourceFile,
  SourceFolder,
  SourceNode,
} from '@/features/app-shell/documentation/sourceTreeTypes';

export function sourceCatalogTests(): void {
  test('source declarations include top-level TypeScript and shell functions and variables', () => {
    const typescript = [
      'function declared() {}',
      'const arrow = () => {};',
      'const expression = function () {};',
      'let value = 1;',
      'const { alpha, nested: { beta } } = input;',
      'const [first, , ...rest] = items;',
      'function outer() { const inner = 1; }',
    ].join('\n');
    assert.deepEqual(extractSourceDeclarations('sample.ts', typescript), [
      { kind: 'function', name: 'declared', line: 1 },
      { kind: 'function', name: 'arrow', line: 2 },
      { kind: 'function', name: 'expression', line: 3 },
      { kind: 'variable', name: 'value', line: 4 },
      { kind: 'variable', name: 'alpha', line: 5 },
      { kind: 'variable', name: 'beta', line: 5 },
      { kind: 'variable', name: 'first', line: 6 },
      { kind: 'variable', name: 'rest', line: 6 },
      { kind: 'function', name: 'outer', line: 7 },
    ]);

    const shell = [
      '#!/usr/bin/env bash',
      'build_world() {',
      '}',
      'function release {',
      '}',
      'export CHANNEL=stable',
      'readonly RETRIES=3',
    ].join('\n');
    assert.deepEqual(extractSourceDeclarations('scripts/build.sh', shell), [
      { kind: 'function', name: 'build_world', line: 2 },
      { kind: 'function', name: 'release', line: 4 },
      { kind: 'variable', name: 'CHANNEL', line: 6 },
      { kind: 'variable', name: 'RETRIES', line: 7 },
    ]);
  });

  test('source traversal sorts folders and files while excluding unsupported and unsafe entries', () => {
    withFixture((root) => {
      writeSource(root, 'zeta.ts', 'export const zeta = 1;');
      writeSource(root, 'src/beta.ts', 'export const beta = 2;');
      writeSource(root, 'src/alpha.ts', 'export function alpha() {}');
      writeSource(root, 'src/types.d.ts', 'declare const hidden: string;');
      writeSource(root, 'src/readme.md', '# hidden');
      writeSource(root, 'scripts/tool.sh', 'run() {\n}\n');
      writeSource(root, 'node_modules/package/index.ts', 'export const hidden = true;');
      writeSource(root, '.hidden/secret.ts', 'export const hidden = true;');
      writeSource(root, '.next/generated.js', 'export const hidden = true;');
      writeSource(root, 'dist/bundle.js', 'export const hidden = true;');
      writeSource(root, 'coverage/report.js', 'export const hidden = true;');
      writeSource(root, 'artifacts/output.js', 'export const hidden = true;');
      symlinkSync(join(root, 'zeta.ts'), join(root, 'linked.ts'));

      const tree = buildSourceTree(root);
      assert.equal(tree.name, basename(root));
      assert.equal(tree.path, '');
      assert.deepEqual(tree.children.map((child) => child.name), ['scripts', 'src', 'zeta.ts']);
      assert.deepEqual(folderAt(tree, 'src').children.map((child) => child.name), [
        'alpha.ts',
        'beta.ts',
      ]);

      const files = sourceFiles(tree);
      assert.deepEqual(files.map((file) => file.path), [
        'scripts/tool.sh',
        'src/alpha.ts',
        'src/beta.ts',
        'zeta.ts',
      ]);
      assert.ok(files.every((file) => /^[a-f0-9]{64}$/.test(file.sourceId)));
      assert.deepEqual(fileAt(tree, 'src/alpha.ts').declarations, [
        { kind: 'function', name: 'alpha', line: 1 },
      ]);
      assert.equal(fileAt(buildSourceTree(root), 'src/alpha.ts').sourceId, fileAt(tree, 'src/alpha.ts').sourceId);
    });
  });

  test('source responses serve exact development text and reject unavailable source identifiers', async () => {
    await withFixture(async (root) => {
      const body = 'export function visible() {\n  return 42;\n}\n';
      writeSource(root, 'src/visible.ts', body);
      const sourceId = fileAt(buildSourceTree(root), 'src/visible.ts').sourceId;

      const response = sourceFileResponse(sourceId, { root, environment: 'development' });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(await response.text(), body);

      assert.equal(sourceFileResponse(sourceId, { root, environment: 'production' }).status, 404);
      assert.equal(sourceFileResponse('not-a-source-id', { root, environment: 'development' }).status, 404);
      assert.equal(sourceFileResponse('0'.repeat(64), { root, environment: 'development' }).status, 404);
    });
  });
}

function withFixture(use: (root: string) => void): void;
function withFixture(use: (root: string) => Promise<void>): Promise<void>;
function withFixture(use: (root: string) => void | Promise<void>): void | Promise<void> {
  const root = mkdtempSync(join(tmpdir(), 'procgen-source-catalog-'));
  try {
    const result = use(root);
    if (result instanceof Promise) return result.finally(() => rmSync(root, { recursive: true }));
    rmSync(root, { recursive: true });
  } catch (error) {
    rmSync(root, { recursive: true });
    throw error;
  }
}

function writeSource(root: string, path: string, source: string): void {
  const segments = path.split('/');
  segments.pop();
  if (segments.length > 0) mkdirSync(join(root, ...segments), { recursive: true });
  writeFileSync(join(root, path), source);
}

function sourceFiles(folder: SourceFolder): SourceFile[] {
  return folder.children.flatMap((child) =>
    child.kind === 'file' ? [child] : sourceFiles(child),
  );
}

function folderAt(root: SourceFolder, path: string): SourceFolder {
  const node = nodeAt(root, path);
  assert.equal(node.kind, 'folder');
  return node as SourceFolder;
}

function fileAt(root: SourceFolder, path: string): SourceFile {
  const node = nodeAt(root, path);
  assert.equal(node.kind, 'file');
  return node as SourceFile;
}

function nodeAt(root: SourceFolder, path: string): SourceNode {
  let node: SourceNode = root;
  for (const segment of path.split('/')) {
    assert.equal(node.kind, 'folder');
    const child: SourceNode | undefined = (node as SourceFolder).children.find(
      (candidate) => candidate.name === segment,
    );
    assert.ok(child, `missing ${path}`);
    node = child;
  }
  return node;
}

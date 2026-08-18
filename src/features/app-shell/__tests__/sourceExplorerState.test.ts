import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  declarationTreeId,
  defaultSourceFile,
  expansionIdsForFile,
  fileTreeId,
  folderTreeId,
  sourceCounts,
  treeKeyAction,
  visibleSourceItems,
} from '@/features/app-shell/documentation/sourceExplorerState';
import type {
  SourceDeclaration,
  SourceFile,
  SourceFolder,
} from '@/features/app-shell/documentation/sourceTreeTypes';

const DOCS_FUNCTION: SourceDeclaration = { kind: 'function', name: 'ApiDocsPage', line: 4 };
const DOCS_VARIABLE: SourceDeclaration = { kind: 'variable', name: 'API_PREFIX', line: 1 };
const WORLD_FUNCTION: SourceDeclaration = { kind: 'function', name: 'buildWorld', line: 8 };
const WORLD_VARIABLE: SourceDeclaration = { kind: 'variable', name: 'WORLD_SEED', line: 2 };
const SERVER_FUNCTION: SourceDeclaration = { kind: 'function', name: 'startServer', line: 6 };

const DOCS_FILE = sourceFile('page.tsx', 'src/app/docs/page.tsx', [DOCS_FUNCTION, DOCS_VARIABLE]);
const WORLD_FILE = sourceFile('world.ts', 'src/features/game/world.ts', [WORLD_FUNCTION, WORLD_VARIABLE]);
const SERVER_FILE = sourceFile('server.ts', 'server.ts', [SERVER_FUNCTION]);
const SOURCE_TREE: SourceFolder = folder('procgen', '', [
  folder('src', 'src', [
    folder('app', 'src/app', [folder('docs', 'src/app/docs', [DOCS_FILE])]),
    folder('features', 'src/features', [folder('game', 'src/features/game', [WORLD_FILE])]),
  ]),
  SERVER_FILE,
]);

export function sourceExplorerStateTests(): void {
  test('the docs page is the default source file and the first file is the fallback', () => {
    assert.equal(defaultSourceFile(SOURCE_TREE), DOCS_FILE);
    assert.equal(defaultSourceFile(folder('empty root', '', [folder('game', 'game', [WORLD_FILE])])), WORLD_FILE);
    assert.equal(defaultSourceFile(folder('empty root', '', [])), null);
  });

  test('selecting a file expands its file row and every ancestor folder', () => {
    assert.deepEqual(expansionIdsForFile(SOURCE_TREE, DOCS_FILE.path), new Set([
      folderTreeId(''),
      folderTreeId('src'),
      folderTreeId('src/app'),
      folderTreeId('src/app/docs'),
      fileTreeId(DOCS_FILE.path),
    ]));
    assert.deepEqual(expansionIdsForFile(SOURCE_TREE, 'missing.ts'), new Set());
  });

  test('visible items respect collapsed folders and expanded files', () => {
    assert.deepEqual(itemIds(visibleSourceItems(SOURCE_TREE, new Set(), '')), [folderTreeId('')]);
    assert.deepEqual(itemIds(visibleSourceItems(SOURCE_TREE, new Set([folderTreeId('')]), '')), [
      folderTreeId(''),
      folderTreeId('src'),
      fileTreeId('server.ts'),
    ]);
    const expanded = expansionIdsForFile(SOURCE_TREE, DOCS_FILE.path);
    assert.deepEqual(itemIds(visibleSourceItems(SOURCE_TREE, expanded, '')), [
      folderTreeId(''),
      folderTreeId('src'),
      folderTreeId('src/app'),
      folderTreeId('src/app/docs'),
      fileTreeId(DOCS_FILE.path),
      declarationTreeId(DOCS_FILE, DOCS_FUNCTION),
      declarationTreeId(DOCS_FILE, DOCS_VARIABLE),
      folderTreeId('src/features'),
      fileTreeId('server.ts'),
    ]);
  });

  test('filters match full paths and filenames while retaining ancestor folders', () => {
    assert.deepEqual(itemNames(visibleSourceItems(SOURCE_TREE, new Set(), 'src/features/game')), [
      'procgen',
      'src',
      'features',
      'game',
      'world.ts',
    ]);
    assert.deepEqual(itemNames(visibleSourceItems(SOURCE_TREE, new Set(), 'page.tsx')), [
      'procgen',
      'src',
      'app',
      'docs',
      'page.tsx',
    ]);
  });

  test('filters match function and variable names while retaining their files and ancestors', () => {
    assert.deepEqual(itemNames(visibleSourceItems(SOURCE_TREE, new Set(), 'buildworld')), [
      'procgen',
      'src',
      'features',
      'game',
      'world.ts',
      'buildWorld',
    ]);
    assert.deepEqual(itemNames(visibleSourceItems(SOURCE_TREE, new Set(), 'world_seed')), [
      'procgen',
      'src',
      'features',
      'game',
      'world.ts',
      'WORLD_SEED',
    ]);
  });

  test('a filter with no source match returns no visible items', () => {
    assert.deepEqual(visibleSourceItems(SOURCE_TREE, new Set(), 'nothing-matches-this'), []);
  });

  test('source counts include every file and declaration regardless of expansion', () => {
    assert.deepEqual(sourceCounts(SOURCE_TREE), { files: 3, declarations: 5 });
  });

  test('keyboard actions move up, down, home, and end within visible items', () => {
    const items = fullyVisibleItems();
    const first = items[0]!.id;
    const second = items[1]!.id;
    const last = items[items.length - 1]!.id;
    assert.deepEqual(treeKeyAction(items, second, 'ArrowUp'), { kind: 'focus', id: first });
    assert.deepEqual(treeKeyAction(items, first, 'ArrowDown'), { kind: 'focus', id: second });
    assert.deepEqual(treeKeyAction(items, last, 'ArrowDown'), { kind: 'focus', id: last });
    assert.deepEqual(treeKeyAction(items, last, 'Home'), { kind: 'focus', id: first });
    assert.deepEqual(treeKeyAction(items, first, 'End'), { kind: 'focus', id: last });
  });

  test('right expands a closed item then focuses its first child when open', () => {
    const collapsed = visibleSourceItems(SOURCE_TREE, new Set(), '');
    assert.deepEqual(treeKeyAction(collapsed, folderTreeId(''), 'ArrowRight'), {
      kind: 'expand',
      id: folderTreeId(''),
    });
    const rootOpen = visibleSourceItems(SOURCE_TREE, new Set([folderTreeId('')]), '');
    assert.deepEqual(treeKeyAction(rootOpen, folderTreeId(''), 'ArrowRight'), {
      kind: 'focus',
      id: folderTreeId('src'),
    });
    const items = fullyVisibleItems();
    assert.deepEqual(treeKeyAction(items, declarationTreeId(DOCS_FILE, DOCS_FUNCTION), 'ArrowRight'), {
      kind: 'none',
    });
  });

  test('left collapses an open item then focuses the parent of a closed item', () => {
    const items = fullyVisibleItems();
    assert.deepEqual(treeKeyAction(items, folderTreeId('src'), 'ArrowLeft'), {
      kind: 'collapse',
      id: folderTreeId('src'),
    });
    const rootOpen = visibleSourceItems(SOURCE_TREE, new Set([folderTreeId('')]), '');
    assert.deepEqual(treeKeyAction(rootOpen, folderTreeId('src'), 'ArrowLeft'), {
      kind: 'focus',
      id: folderTreeId(''),
    });
    assert.deepEqual(treeKeyAction(rootOpen, folderTreeId(''), 'ArrowLeft'), {
      kind: 'collapse',
      id: folderTreeId(''),
    });
    assert.deepEqual(treeKeyAction([], folderTreeId(''), 'ArrowLeft'), { kind: 'none' });
  });
}

function fullyVisibleItems() {
  return visibleSourceItems(SOURCE_TREE, new Set([
    folderTreeId(''),
    folderTreeId('src'),
    folderTreeId('src/app'),
    folderTreeId('src/app/docs'),
    fileTreeId(DOCS_FILE.path),
    folderTreeId('src/features'),
    folderTreeId('src/features/game'),
    fileTreeId(WORLD_FILE.path),
    fileTreeId(SERVER_FILE.path),
  ]), '');
}

function itemIds(items: ReturnType<typeof visibleSourceItems>): string[] {
  return items.map((item) => item.id);
}

function itemNames(items: ReturnType<typeof visibleSourceItems>): string[] {
  return items.map((item) => item.name);
}

function sourceFile(
  name: string,
  path: string,
  declarations: SourceDeclaration[],
): SourceFile {
  return { kind: 'file', name, path, sourceId: `source:${path}`, declarations };
}

function folder(name: string, path: string, children: SourceFolder['children']): SourceFolder {
  return { kind: 'folder', name, path, children };
}

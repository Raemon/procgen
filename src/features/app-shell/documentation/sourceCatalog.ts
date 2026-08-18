import { createHash } from 'node:crypto';
import {
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  type Dirent,
} from 'node:fs';
import {
  basename,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import ts from 'typescript';
import type {
  SourceDeclaration,
  SourceFile,
  SourceFolder,
  SourceNode,
} from './sourceTreeTypes';

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.sh',
]);
const JAVASCRIPT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);
const EXCLUDED_DIRECTORIES = new Set([
  'node_modules',
  '.next',
  'dist',
  'coverage',
  'artifacts',
]);
const SOURCE_ID = /^[a-f0-9]{64}$/;
const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'text/plain; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

interface CatalogFile {
  absolutePath: string;
  name: string;
  path: string;
  sourceId: string;
}

export function buildSourceTree(root: string = process.cwd()): SourceFolder {
  const realRoot = realDirectory(root);
  const tree: SourceFolder = {
    kind: 'folder',
    name: basename(realRoot),
    path: '',
    children: [],
  };
  for (const file of catalogFiles(realRoot)) insertFile(tree, sourceFileFrom(file));
  sortTree(tree);
  return tree;
}

export function extractSourceDeclarations(path: string, source: string): SourceDeclaration[] {
  const extension = extname(path).toLowerCase();
  if (extension === '.sh') return shellDeclarations(source);
  if (!JAVASCRIPT_EXTENSIONS.has(extension)) return [];
  return javascriptDeclarations(path, source);
}

export function sourceFileResponse(
  sourceId: string,
  options: { root?: string; environment?: string } = {},
): Response {
  const environment = options.environment ?? process.env.NODE_ENV;
  if (environment !== 'development' || !SOURCE_ID.test(sourceId)) return notFound();
  const root = realDirectoryOrNull(options.root ?? process.cwd());
  if (!root) return notFound();
  const file = catalogFiles(root).find((candidate) => candidate.sourceId === sourceId);
  if (!file) return notFound();
  try {
    return new Response(readFileSync(file.absolutePath, 'utf8'), { headers: RESPONSE_HEADERS });
  } catch {
    return notFound();
  }
}

function catalogFiles(root: string): CatalogFile[] {
  const files: CatalogFile[] = [];
  visitDirectory(root, root, files);
  return files.sort((left, right) => compareText(left.path, right.path));
}

function visitDirectory(root: string, directory: string, files: CatalogFile[]): void {
  for (const entry of safeEntries(directory)) {
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
    const absolutePath = join(directory, entry.name);
    const stats = safeLstat(absolutePath);
    if (!stats || stats.isSymbolicLink()) continue;
    if (stats.isDirectory()) {
      if (!EXCLUDED_DIRECTORIES.has(entry.name)) visitDirectory(root, absolutePath, files);
      continue;
    }
    if (!stats.isFile() || !isSourceFile(entry.name)) continue;
    const realPath = safeRealpath(absolutePath);
    if (!realPath || !isInside(root, realPath)) continue;
    const normalizedPath = normalizeRelativePath(root, realPath);
    files.push({
      absolutePath: realPath,
      name: entry.name,
      path: normalizedPath,
      sourceId: sourceIdOf(normalizedPath),
    });
  }
}

function safeEntries(directory: string): Dirent[] {
  try {
    return readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}

function safeLstat(path: string): ReturnType<typeof lstatSync> | null {
  try {
    return lstatSync(path);
  } catch {
    return null;
  }
}

function safeRealpath(path: string): string | null {
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}

function realDirectory(path: string): string {
  const realPath = realpathSync(resolve(path));
  if (!lstatSync(realPath).isDirectory()) throw new Error(`${path} is not a directory`);
  return realPath;
}

function realDirectoryOrNull(path: string): string | null {
  try {
    return realDirectory(path);
  } catch {
    return null;
  }
}

function isSourceFile(name: string): boolean {
  const lower = name.toLowerCase();
  if (/\.d\.(?:ts|tsx|mts|cts)$/.test(lower)) return false;
  return SOURCE_EXTENSIONS.has(extname(lower));
}

function isInside(root: string, path: string): boolean {
  const fromRoot = relative(root, path);
  return fromRoot !== '' && !fromRoot.startsWith(`..${sep}`) && fromRoot !== '..' && !isAbsolute(fromRoot);
}

function normalizeRelativePath(root: string, path: string): string {
  return relative(root, path).split(sep).join('/');
}

function sourceIdOf(path: string): string {
  return createHash('sha256').update(path).digest('hex');
}

function sourceFileFrom(file: CatalogFile): SourceFile {
  const source = readFileSync(file.absolutePath, 'utf8');
  return {
    kind: 'file',
    name: file.name,
    path: file.path,
    sourceId: file.sourceId,
    declarations: extractSourceDeclarations(file.path, source),
  };
}

function insertFile(root: SourceFolder, file: SourceFile): void {
  const segments = file.path.split('/');
  segments.pop();
  let folder = root;
  for (const segment of segments) folder = childFolder(folder, segment);
  folder.children.push(file);
}

function childFolder(parent: SourceFolder, name: string): SourceFolder {
  const existing = parent.children.find(
    (child): child is SourceFolder => child.kind === 'folder' && child.name === name,
  );
  if (existing) return existing;
  const folder: SourceFolder = {
    kind: 'folder',
    name,
    path: parent.path === '' ? name : `${parent.path}/${name}`,
    children: [],
  };
  parent.children.push(folder);
  return folder;
}

function sortTree(folder: SourceFolder): void {
  folder.children.sort(compareNodes);
  for (const child of folder.children) if (child.kind === 'folder') sortTree(child);
}

function compareNodes(left: SourceNode, right: SourceNode): number {
  if (left.kind !== right.kind) return left.kind === 'folder' ? -1 : 1;
  return compareText(left.name, right.name);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function javascriptDeclarations(path: string, source: string): SourceDeclaration[] {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, scriptKind(path));
  const declarations: SourceDeclaration[] = [];
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarations.push(declaration('function', statement.name.text, statement.name, file));
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const variable of statement.declarationList.declarations) {
      const kind = functionValued(variable.initializer) ? 'function' : 'variable';
      for (const name of bindingNames(variable.name)) {
        declarations.push(declaration(kind, name.text, name, file));
      }
    }
  }
  return declarations;
}

function scriptKind(path: string): ts.ScriptKind {
  const extension = extname(path).toLowerCase();
  if (extension === '.tsx') return ts.ScriptKind.TSX;
  if (extension === '.jsx') return ts.ScriptKind.JSX;
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function functionValued(initializer: ts.Expression | undefined): boolean {
  return initializer !== undefined &&
    (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer));
}

function bindingNames(name: ts.BindingName): ts.Identifier[] {
  if (ts.isIdentifier(name)) return [name];
  return name.elements.flatMap((element) =>
    ts.isOmittedExpression(element) ? [] : bindingNames(element.name),
  );
}

function declaration(
  kind: SourceDeclaration['kind'],
  name: string,
  node: ts.Node,
  file: ts.SourceFile,
): SourceDeclaration {
  return {
    kind,
    name,
    line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
  };
}

function shellDeclarations(source: string): SourceDeclaration[] {
  const declarations: SourceDeclaration[] = [];
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const functionName = shellFunctionName(line);
    if (functionName) {
      declarations.push({ kind: 'function', name: functionName, line: index + 1 });
      continue;
    }
    const assignment = line.match(
      /^(?:(?:export|readonly|declare|typeset)[ \t]+)*([A-Za-z_][A-Za-z0-9_]*)=/,
    );
    if (assignment?.[1]) {
      declarations.push({ kind: 'variable', name: assignment[1], line: index + 1 });
    }
  }
  return declarations;
}

function shellFunctionName(line: string): string | null {
  const match = line.match(
    /^(?:function[ \t]+([A-Za-z_][A-Za-z0-9_-]*)(?:[ \t]*\(\))?|([A-Za-z_][A-Za-z0-9_-]*)[ \t]*\(\))[ \t]*\{/,
  );
  return match?.[1] ?? match?.[2] ?? null;
}

function notFound(): Response {
  return new Response('Not found', { status: 404, headers: RESPONSE_HEADERS });
}

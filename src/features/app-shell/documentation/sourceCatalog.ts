import { lstatSync, readFileSync, readdirSync, realpathSync, type Dirent } from 'node:fs';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

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
const EXCLUDED_DIRECTORIES = new Set([
  'node_modules',
  '.next',
  'dist',
  'coverage',
  'artifacts',
]);

interface CatalogFile {
  absolutePath: string;
  path: string;
}

export interface CatalogedSourceFile {
  absolutePath: string;
  path: string;
  source: string;
}

export function catalogSourceFiles(root: string = process.cwd()): CatalogedSourceFile[] {
  return catalogFiles(realDirectory(root)).map((file) => ({
    absolutePath: file.absolutePath,
    path: file.path,
    source: readFileSync(file.absolutePath, 'utf8'),
  }));
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
    files.push({ absolutePath: realPath, path: normalizeRelativePath(root, realPath) });
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

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

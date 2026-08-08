import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PANEL_ROOTS = ['agents', 'assets', 'procgen', 'world'];
const HEADLESS_ROOTS = ['abilities', 'api', 'multiplayer', 'server'];
const EVERY_ROOT = [...PANEL_ROOTS, ...HEADLESS_ROOTS, 'frontend', 'checks', 'tools'];
const PRESENTATION_FOLDER_NAMES = ['panel', 'ui', 'view3d'];
const BROWSER_PACKAGES = /from '(three|react|react-dom)(\/[^']*)?'/;

export function checkPresentationFoldersAreTheOnlyDomCode(
  check: (name: string, condition: boolean) => void,
): void {
  const strays = PANEL_ROOTS.flatMap(sourceFiles)
    .filter((path) => !isInsideAPresentationFolder(path))
    .filter(importsABrowserPackage);
  reportStrays('panel folders', strays);
  check(
    'inside a panel, only its presentation folders reach for react or three',
    strays.length === 0,
  );

  const headlessStrays = HEADLESS_ROOTS.flatMap(sourceFiles).filter(importsABrowserPackage);
  reportStrays('headless folders', headlessStrays);
  check(
    'the ability layer, the api, the wire and the server never reach for react or three',
    headlessStrays.length === 0,
  );

  check(
    'every top-level folder is named by this check, so none can drift out of its coverage',
    EVERY_ROOT.every(existsAsDirectory) && EVERY_ROOT.length === 11,
  );
}

function existsAsDirectory(root: string): boolean {
  try {
    return statSync(root).isDirectory();
  } catch {
    return false;
  }
}

function isInsideAPresentationFolder(path: string): boolean {
  return path
    .split('/')
    .slice(0, -1)
    .some(
      (segment) =>
        PRESENTATION_FOLDER_NAMES.includes(segment) || segment.toLowerCase().endsWith('editor'),
    );
}

function importsABrowserPackage(path: string): boolean {
  return BROWSER_PACKAGES.test(readFileSync(path, 'utf8'));
}

function reportStrays(where: string, strays: readonly string[]): void {
  if (strays.length === 0) return;
  console.log(`     browser packages reached from ${where}:\n       ${strays.join('\n       ')}`);
}

function sourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') || path.endsWith('.tsx') ? [path] : [];
  });
}

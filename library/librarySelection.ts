import { ASSET_KINDS } from '../assets/asset';

export const LIBRARY_FOLDERS = ['worlds', ...ASSET_KINDS, 'groups'] as const;

export type LibraryFolder = (typeof LIBRARY_FOLDERS)[number];

export interface LibrarySelection {
  folder: LibraryFolder;
  key: string;
}

export const NOTHING_SELECTED = null;

export function isLibrarySelection(value: unknown): value is LibrarySelection | null {
  if (value === null) return true;
  if (typeof value !== 'object') return false;
  const candidate = value as { folder?: unknown; key?: unknown };
  return isLibraryFolder(candidate.folder) && typeof candidate.key === 'string';
}

function isLibraryFolder(value: unknown): value is LibraryFolder {
  return LIBRARY_FOLDERS.includes(value as LibraryFolder);
}

export function selects(
  selection: LibrarySelection | null,
  folder: LibraryFolder,
  key: string,
): boolean {
  return selection?.folder === folder && selection.key === key;
}

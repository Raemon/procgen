import { ASSET_KINDS } from '@/features/asset-library/asset';

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

export function isLibraryFolder(value: unknown): value is LibraryFolder {
  return LIBRARY_FOLDERS.includes(value as LibraryFolder);
}

export function selects(
  selection: LibrarySelection | null,
  folder: LibraryFolder,
  key: string,
): boolean {
  return selection?.folder === folder && selection.key === key;
}

export interface OpenedLibraryRow {
  selection: LibrarySelection | null;
  detailIsOpen: boolean;
}

export function nextSelectionOnOpen(
  selection: LibrarySelection | null,
  folder: LibraryFolder,
  key: string,
): OpenedLibraryRow {
  return selects(selection, folder, key)
    ? { selection: NOTHING_SELECTED, detailIsOpen: false }
    : { selection: { folder, key }, detailIsOpen: true };
}

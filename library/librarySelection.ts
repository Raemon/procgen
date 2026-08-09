import { ASSET_KINDS, type AssetKind } from '../assets/asset';

export const LIBRARY_FOLDERS = ['world', ...ASSET_KINDS, 'groups', 'pipeline'] as const;

export type LibraryFolder = (typeof LIBRARY_FOLDERS)[number];

export interface LibrarySelection {
  folder: LibraryFolder;
  key: string;
}

export const WORLD_SELECTED: LibrarySelection = { folder: 'world', key: '' };

export function isLibrarySelection(value: unknown): value is LibrarySelection {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { folder?: unknown; key?: unknown };
  return isLibraryFolder(candidate.folder) && typeof candidate.key === 'string';
}

export function isLibraryFolder(value: unknown): value is LibraryFolder {
  return LIBRARY_FOLDERS.includes(value as LibraryFolder);
}

export function isAssetFolder(folder: LibraryFolder): folder is AssetKind {
  return ASSET_KINDS.includes(folder as AssetKind);
}

export function selects(selection: LibrarySelection, folder: LibraryFolder, key: string): boolean {
  return selection.folder === folder && selection.key === key;
}

import { isLibraryFolder, type LibraryFolder } from '../../librarySelection';

export const ASSET_MIME = 'text/procgen-asset';
export const ASSET_FOLDER_MIME = 'text/procgen-asset-folder';

export interface DraggedAsset {
  section: LibraryFolder;
  key: string;
}

export function assetMimeOf(section: LibraryFolder): string {
  return `${ASSET_MIME}-${section}`;
}

export function assetFolderMimeOf(section: LibraryFolder): string {
  return `${ASSET_FOLDER_MIME}-${section}`;
}

export function startAssetDrag(
  dataTransfer: DataTransfer,
  section: LibraryFolder,
  key: string,
): void {
  const payload = JSON.stringify({ section, key } satisfies DraggedAsset);
  dataTransfer.setData(ASSET_MIME, payload);
  dataTransfer.setData(assetMimeOf(section), payload);
  dataTransfer.effectAllowed = 'move';
}

export function startAssetFolderDrag(
  dataTransfer: DataTransfer,
  section: LibraryFolder,
  folderId: string,
): void {
  dataTransfer.setData(ASSET_FOLDER_MIME, folderId);
  dataTransfer.setData(assetFolderMimeOf(section), folderId);
  dataTransfer.effectAllowed = 'move';
}

export function draggedAsset(dataTransfer: DataTransfer | null): DraggedAsset | null {
  const raw = dataTransfer?.getData(ASSET_MIME);
  if (!raw) return null;
  const held = parsedJson(raw) as { section?: unknown; key?: unknown } | null;
  if (!held || !isLibraryFolder(held.section) || typeof held.key !== 'string') return null;
  return { section: held.section, key: held.key };
}

export function draggedAssetFolder(dataTransfer: DataTransfer | null): string | null {
  return dataTransfer?.getData(ASSET_FOLDER_MIME) || null;
}

export function carriesAssetOf(
  dataTransfer: DataTransfer | null,
  section: LibraryFolder,
): boolean {
  return dataTransfer?.types.includes(assetMimeOf(section)) ?? false;
}

export function carriesAssetFolderOf(
  dataTransfer: DataTransfer | null,
  section: LibraryFolder,
): boolean {
  return dataTransfer?.types.includes(assetFolderMimeOf(section)) ?? false;
}

export function carriesAnythingFileableIn(
  dataTransfer: DataTransfer | null,
  section: LibraryFolder,
): boolean {
  return carriesAssetOf(dataTransfer, section) || carriesAssetFolderOf(dataTransfer, section);
}

function parsedJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

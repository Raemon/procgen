import type { LibraryFolder } from '../librarySelection';
import type { AssetFolder, AssetPlacements, StoredAssetFolders } from './assetFolder';

export interface AssetFolderSync {
  stored: StoredAssetFolders;
  addedFolders: number;
  addedPlacements: number;
}

export function syncMissingAssetFolders(
  held: StoredAssetFolders,
  shipped: StoredAssetFolders,
): AssetFolderSync {
  const folders = [...held.folders, ...foldersHeldLacks(held.folders, shipped.folders)];
  const known = new Set(folders.map((folder) => folder.id));
  const placements = { ...held.placements };
  let addedPlacements = 0;
  for (const [section, filed] of sectionsOf(shipped.placements)) {
    const already = placements[section] ?? {};
    const kept = { ...already };
    for (const [key, folderId] of Object.entries(filed)) {
      if (kept[key] !== undefined || !known.has(folderId)) continue;
      kept[key] = folderId;
      addedPlacements += 1;
    }
    placements[section] = kept;
  }
  return {
    stored: { folders, placements },
    addedFolders: folders.length - held.folders.length,
    addedPlacements,
  };
}

function foldersHeldLacks(
  held: readonly AssetFolder[],
  shipped: readonly AssetFolder[],
): AssetFolder[] {
  const have = new Set(held.map((folder) => folder.id));
  return shipped.filter((folder) => !have.has(folder.id));
}

function sectionsOf(placements: AssetPlacements): [LibraryFolder, Record<string, string>][] {
  return Object.entries(placements).filter(
    (entry): entry is [LibraryFolder, Record<string, string>] => entry[1] !== undefined,
  );
}

import { isLibraryFolder, type LibraryFolder } from '../librarySelection';

const SECTION_NAMES_BEFORE_THE_WORLD_SEED_RENAME: Record<string, LibraryFolder> = {
  worlds: 'worldSeeds',
};

function sectionFromStoredJson(raw: unknown): LibraryFolder | null {
  if (typeof raw === 'string' && raw in SECTION_NAMES_BEFORE_THE_WORLD_SEED_RENAME) {
    return SECTION_NAMES_BEFORE_THE_WORLD_SEED_RENAME[raw] ?? null;
  }
  return isLibraryFolder(raw) ? raw : null;
}

export interface AssetFolder {
  id: string;
  name: string;
  section: LibraryFolder;
  parentId: string | null;
}

export type AssetPlacements = Partial<Record<LibraryFolder, Record<string, string>>>;

export interface StoredAssetFolders {
  folders: AssetFolder[];
  placements: AssetPlacements;
}

export function noAssetFolders(): StoredAssetFolders {
  return { folders: [], placements: {} };
}

export function assetFoldersFromStoredJson(raw: unknown): StoredAssetFolders {
  const held = (raw ?? {}) as { folders?: unknown; placements?: unknown };
  const folders = wellFormedFolders(held.folders);
  dropUnknownParents(folders);
  breakParentCycles(folders);
  return { folders, placements: placementsWithAKnownFolder(held.placements, folders) };
}

export function nextFolderId(folders: readonly AssetFolder[]): string {
  const taken = new Set(folders.map((folder) => folder.id));
  let at = 1;
  while (taken.has(`f${at}`)) at += 1;
  return `f${at}`;
}

function wellFormedFolders(raw: unknown): AssetFolder[] {
  if (!Array.isArray(raw)) return [];
  const kept: AssetFolder[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const folder = folderFromStoredJson(entry);
    if (!folder || seen.has(folder.id)) continue;
    seen.add(folder.id);
    kept.push(folder);
  }
  return kept;
}

function folderFromStoredJson(raw: unknown): AssetFolder | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const held = raw as { id?: unknown; name?: unknown; section?: unknown; parentId?: unknown };
  if (typeof held.id !== 'string' || held.id === '') return null;
  if (typeof held.name !== 'string' || held.name.trim() === '') return null;
  const section = sectionFromStoredJson(held.section);
  if (!section) return null;
  return {
    id: held.id,
    name: held.name,
    section,
    parentId: typeof held.parentId === 'string' ? held.parentId : null,
  };
}

function dropUnknownParents(folders: AssetFolder[]): void {
  const byId = foldersById(folders);
  for (const folder of folders) {
    const parent = folder.parentId === null ? undefined : byId.get(folder.parentId);
    if (!parent || parent.section !== folder.section) folder.parentId = null;
  }
}

function breakParentCycles(folders: AssetFolder[]): void {
  const byId = foldersById(folders);
  for (const folder of folders) {
    const walked = new Set<string>([folder.id]);
    let ancestor = ancestorOf(folder, byId);
    while (ancestor) {
      if (walked.has(ancestor.id)) {
        folder.parentId = null;
        break;
      }
      walked.add(ancestor.id);
      ancestor = ancestorOf(ancestor, byId);
    }
  }
}

function ancestorOf(
  folder: AssetFolder,
  byId: Map<string, AssetFolder>,
): AssetFolder | undefined {
  return folder.parentId === null ? undefined : byId.get(folder.parentId);
}

function foldersById(folders: readonly AssetFolder[]): Map<string, AssetFolder> {
  return new Map(folders.map((folder) => [folder.id, folder]));
}

function placementsWithAKnownFolder(
  raw: unknown,
  folders: readonly AssetFolder[],
): AssetPlacements {
  if (typeof raw !== 'object' || raw === null) return {};
  const byId = foldersById(folders);
  const placements: AssetPlacements = {};
  for (const [storedSection, filed] of Object.entries(raw as Record<string, unknown>)) {
    const section = sectionFromStoredJson(storedSection);
    if (!section) continue;
    if (typeof filed !== 'object' || filed === null) continue;
    const kept: Record<string, string> = {};
    for (const [key, folderId] of Object.entries(filed as Record<string, unknown>)) {
      if (typeof folderId !== 'string') continue;
      if (byId.get(folderId)?.section === section) kept[key] = folderId;
    }
    if (Object.keys(kept).length > 0) placements[section] = kept;
  }
  return placements;
}

import type { LibraryFolder } from '../librarySelection';
import {
  nextFolderId,
  type AssetFolder,
  type AssetPlacements,
  type StoredAssetFolders,
} from './assetFolder';
import { loadStoredAssetFolders, storeAssetFolders } from './assetFolderStorage';

export class AssetFolders {
  private folders: AssetFolder[];
  private placements: AssetPlacements;
  private snapshot: StoredAssetFolders | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(stored: StoredAssetFolders = loadStoredAssetFolders()) {
    this.folders = stored.folders;
    this.placements = stored.placements;
  }

  stored(): StoredAssetFolders {
    this.snapshot ??= { folders: this.folders, placements: this.placements };
    return this.snapshot;
  }

  all(): readonly AssetFolder[] {
    return this.folders;
  }

  byId(id: string): AssetFolder | undefined {
    return this.folders.find((folder) => folder.id === id);
  }

  inSection(section: LibraryFolder): AssetFolder[] {
    return this.folders.filter((folder) => folder.section === section);
  }

  childrenOf(section: LibraryFolder, parentId: string | null): AssetFolder[] {
    return this.folders.filter(
      (folder) => folder.section === section && folder.parentId === parentId,
    );
  }

  folderOf(section: LibraryFolder, key: string): string | null {
    return this.placements[section]?.[key] ?? null;
  }

  keysIn(section: LibraryFolder, folderId: string): string[] {
    return Object.entries(this.placements[section] ?? {})
      .filter(([, held]) => held === folderId)
      .map(([key]) => key);
  }

  add(section: LibraryFolder, name: string, parentId: string | null = null): AssetFolder {
    const parent = parentId === null ? undefined : this.byId(parentId);
    const folder: AssetFolder = {
      id: nextFolderId(this.folders),
      name,
      section,
      parentId: parent?.section === section ? parent.id : null,
    };
    this.folders = [...this.folders, folder];
    this.announce();
    return folder;
  }

  rename(id: string, name: string): boolean {
    if (!this.byId(id)) return false;
    this.folders = this.folders.map((folder) =>
      folder.id === id ? { ...folder, name } : folder,
    );
    this.announce();
    return true;
  }

  remove(id: string): boolean {
    const removed = this.byId(id);
    if (!removed) return false;
    this.folders = this.folders
      .filter((folder) => folder.id !== id)
      .map((folder) => (folder.parentId === id ? { ...folder, parentId: removed.parentId } : folder));
    this.placements = placementsMovedUp(this.placements, removed);
    this.announce();
    return true;
  }

  move(id: string, parentId: string | null, beforeId?: string): boolean {
    const moving = this.byId(id);
    if (!moving) return false;
    const parent = parentId === null ? null : this.byId(parentId);
    if (parentId !== null && !parent) return false;
    if (parent && parent.section !== moving.section) return false;
    if (parent && this.descends(parent.id, id)) return false;
    const rest = this.folders.filter((folder) => folder.id !== id);
    const at = beforeId === undefined ? -1 : rest.findIndex((folder) => folder.id === beforeId);
    const moved: AssetFolder = { ...moving, parentId: parent?.id ?? null };
    this.folders = at < 0 ? [...rest, moved] : [...rest.slice(0, at), moved, ...rest.slice(at)];
    this.announce();
    return true;
  }

  place(section: LibraryFolder, key: string, folderId: string | null): boolean {
    if (folderId === null) {
      this.forgetKey(section, key);
      return true;
    }
    if (this.byId(folderId)?.section !== section) return false;
    this.placements = {
      ...this.placements,
      [section]: { ...this.placements[section], [key]: folderId },
    };
    this.announce();
    return true;
  }

  forgetKey(section: LibraryFolder, key: string): void {
    const filed = this.placements[section];
    if (!filed || filed[key] === undefined) return;
    const kept = { ...filed };
    delete kept[key];
    this.placements = { ...this.placements, [section]: kept };
    this.announce();
  }

  renameKey(section: LibraryFolder, from: string, to: string): void {
    const folderId = this.folderOf(section, from);
    if (folderId === null) return;
    this.forgetKey(section, from);
    this.place(section, to, folderId);
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  private descends(candidate: string, ancestorId: string): boolean {
    let at: AssetFolder | undefined = this.byId(candidate);
    while (at) {
      if (at.id === ancestorId) return true;
      at = at.parentId === null ? undefined : this.byId(at.parentId);
    }
    return false;
  }

  private announce(): void {
    this.snapshot = null;
    storeAssetFolders(this.stored());
    for (const listener of this.listeners) listener();
  }
}

function placementsMovedUp(
  placements: AssetPlacements,
  removed: AssetFolder,
): AssetPlacements {
  const filed = placements[removed.section];
  if (!filed) return placements;
  const kept: Record<string, string> = {};
  for (const [key, folderId] of Object.entries(filed)) {
    if (folderId !== removed.id) kept[key] = folderId;
    else if (removed.parentId !== null) kept[key] = removed.parentId;
  }
  return { ...placements, [removed.section]: kept };
}

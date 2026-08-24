import type { SavedWorld } from './savedWorld';
import { loadStoredSavedWorlds, storeSavedWorlds } from './savedWorldStorage';
import type { StoredSavedWorlds } from './storedSavedWorlds';

export class SavedWorldLibrary {
  private worlds: SavedWorld[];
  private readonly listeners = new Set<() => void>();

  constructor(stored: StoredSavedWorlds = loadStoredSavedWorlds()) {
    this.worlds = stored.worlds;
  }

  stored(): StoredSavedWorlds {
    return { worlds: this.worlds };
  }

  all(): readonly SavedWorld[] {
    return this.worlds;
  }

  byName(name: string): SavedWorld | undefined {
    return this.worlds.find((saved) => saved.name === name);
  }

  save(saved: SavedWorld): void {
    const kept = this.worlds.filter((existing) => existing.name !== saved.name);
    this.worlds = [...kept, saved].sort(byName);
    this.persistAndNotify();
  }

  remove(name: string): void {
    if (!this.byName(name)) return;
    this.worlds = this.worlds.filter((saved) => saved.name !== name);
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  private persistAndNotify(): void {
    storeSavedWorlds(this.stored());
    for (const listener of this.listeners) listener();
  }
}

function byName(one: SavedWorld, other: SavedWorld): number {
  return one.name.localeCompare(other.name);
}

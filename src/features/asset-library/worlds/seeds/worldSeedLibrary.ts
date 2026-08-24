import type { StoredWorldSeedLibrary } from './storedWorldSeedLibrary';
import { loadStoredWorldSeedLibrary, storeWorldSeedLibrary } from './worldSeedStorage';
import type { WorldSeed } from './worldSeed';

export class WorldSeedLibrary {
  private saved: WorldSeed[];
  private hidden: string[];
  private readonly listeners = new Set<() => void>();

  constructor(stored: StoredWorldSeedLibrary = loadStoredWorldSeedLibrary()) {
    this.saved = stored.seeds;
    this.hidden = stored.hiddenExamples;
  }

  stored(): StoredWorldSeedLibrary {
    return { seeds: this.saved, hiddenExamples: this.hidden };
  }

  savedWorldSeeds(): readonly WorldSeed[] {
    return this.saved;
  }

  hiddenExamples(): readonly string[] {
    return this.hidden;
  }

  byName(name: string): WorldSeed | undefined {
    return this.saved.find((preset) => preset.name === name);
  }

  save(preset: WorldSeed): void {
    this.saved = [...this.saved.filter((existing) => existing.name !== preset.name), preset];
    this.persistAndNotify();
  }

  remove(name: string): void {
    this.saved = this.saved.filter((preset) => preset.name !== name);
    this.persistAndNotify();
  }

  hideExample(name: string): void {
    if (this.hidden.includes(name)) return;
    this.hidden = [...this.hidden, name];
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  private persistAndNotify(): void {
    storeWorldSeedLibrary(this.stored());
    for (const listener of this.listeners) listener();
  }
}

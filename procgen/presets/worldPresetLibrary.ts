import type { StoredWorldLibrary } from './storedWorldLibrary';
import { loadStoredWorldLibrary, storeWorldLibrary } from './worldPresetStorage';
import type { WorldPreset } from './worldPreset';

export class WorldPresetLibrary {
  private saved: WorldPreset[];
  private hidden: string[];
  private readonly listeners = new Set<() => void>();

  constructor(stored: StoredWorldLibrary = loadStoredWorldLibrary()) {
    this.saved = stored.presets;
    this.hidden = stored.hiddenExamples;
  }

  stored(): StoredWorldLibrary {
    return { presets: this.saved, hiddenExamples: this.hidden };
  }

  savedPresets(): readonly WorldPreset[] {
    return this.saved;
  }

  hiddenExamples(): readonly string[] {
    return this.hidden;
  }

  byName(name: string): WorldPreset | undefined {
    return this.saved.find((preset) => preset.name === name);
  }

  save(preset: WorldPreset): void {
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
    storeWorldLibrary(this.stored());
    for (const listener of this.listeners) listener();
  }
}

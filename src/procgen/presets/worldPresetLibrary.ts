import { loadSavedWorldPresets, storeSavedWorldPresets } from './worldPresetStorage';
import type { WorldPreset } from './worldPreset';

export class WorldPresetLibrary {
  private saved: WorldPreset[];
  private readonly listeners = new Set<() => void>();

  constructor(initialPresets?: WorldPreset[]) {
    this.saved = initialPresets ?? loadSavedWorldPresets();
  }

  savedPresets(): readonly WorldPreset[] {
    return this.saved;
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

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private persistAndNotify(): void {
    storeSavedWorldPresets(this.saved);
    for (const listener of this.listeners) listener();
  }
}

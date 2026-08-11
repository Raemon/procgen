import { exampleWorlds } from './exampleWorlds';
import type { WorldPreset } from './worldPreset';
import type { WorldPresetLibrary } from './worldPresetLibrary';

export class WorldShelf {
  private everyWorld: WorldPreset[] | null = null;

  constructor(private readonly presets: WorldPresetLibrary) {
    presets.onChange(() => (this.everyWorld = null));
  }

  all(): WorldPreset[] {
    this.everyWorld ??= [...this.presets.savedPresets(), ...this.examplesStillOnTheShelf()].sort(byName);
    return this.everyWorld;
  }

  byName(name: string): WorldPreset | undefined {
    return this.all().find((world) => world.name === name);
  }

  onChange(listener: () => void): () => void {
    return this.presets.onChange(listener);
  }

  private examplesStillOnTheShelf(): WorldPreset[] {
    return exampleWorlds().filter(
      (example) =>
        !this.presets.hiddenExamples().includes(example.name) &&
        !this.presets.byName(example.name),
    );
  }
}

function byName(one: WorldPreset, other: WorldPreset): number {
  return one.name.localeCompare(other.name);
}

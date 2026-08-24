import { exampleWorldSeeds } from './exampleWorldSeeds';
import type { WorldSeed } from './worldSeed';
import type { WorldSeedLibrary } from './worldSeedLibrary';

export class WorldSeedShelf {
  private everyWorld: WorldSeed[] | null = null;

  constructor(private readonly seeds: WorldSeedLibrary) {
    seeds.onChange(() => (this.everyWorld = null));
  }

  all(): WorldSeed[] {
    this.everyWorld ??= [...this.seeds.savedWorldSeeds(), ...this.examplesStillOnTheShelf()].sort(byName);
    return this.everyWorld;
  }

  byName(name: string): WorldSeed | undefined {
    return this.all().find((world) => world.name === name);
  }

  onChange(listener: () => void): () => void {
    return this.seeds.onChange(listener);
  }

  private examplesStillOnTheShelf(): WorldSeed[] {
    return exampleWorldSeeds().filter(
      (example) =>
        !this.seeds.hiddenExamples().includes(example.name) &&
        !this.seeds.byName(example.name),
    );
  }
}

function byName(one: WorldSeed, other: WorldSeed): number {
  return one.name.localeCompare(other.name);
}

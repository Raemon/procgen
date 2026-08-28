import { exampleWorldSeeds } from './exampleWorldSeeds';
import type { WorldSeed } from './worldSeed';
import type { WorldSeedLibrary } from './worldSeedLibrary';

export class WorldSeedShelf {
  private everyWorldSeed: WorldSeed[] | null = null;

  constructor(private readonly seeds: WorldSeedLibrary) {
    seeds.onChange(() => (this.everyWorldSeed = null));
  }

  all(): WorldSeed[] {
    this.everyWorldSeed ??= [...this.seeds.savedWorldSeeds(), ...this.examplesStillOnTheShelf()].sort(byName);
    return this.everyWorldSeed;
  }

  byName(name: string): WorldSeed | undefined {
    return this.all().find((seed) => seed.name === name);
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

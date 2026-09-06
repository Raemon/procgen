import type { ExamplePipeline } from './examplePipeline';
import { infiniteLabyrinth } from './infiniteLabyrinth';
import { sunkenLabyrinth } from './sunkenLabyrinth';
import { volcanicIslands } from './volcanicIslands';

export type { ExamplePipeline };

const contributed: Array<() => ExamplePipeline> = [];

export function registerExampleWorldSeed(seed: () => ExamplePipeline): void {
  if (!contributed.includes(seed)) contributed.push(seed);
}

export function contributedWorldSeedCount(): number {
  return contributed.length;
}

export function examplePipelines(): ExamplePipeline[] {
  return [volcanicIslands(), infiniteLabyrinth(), sunkenLabyrinth(), ...contributed.map((seed) => seed())];
}

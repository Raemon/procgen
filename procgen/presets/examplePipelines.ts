import type { ExamplePipeline } from './examplePipeline';
import { infiniteLabyrinth } from './infiniteLabyrinth';
import { volcanicIslands } from './volcanicIslands';

export type { ExamplePipeline };
export { infiniteLabyrinth, volcanicIslands };

export function examplePipelines(): ExamplePipeline[] {
  return [volcanicIslands(), infiniteLabyrinth()];
}

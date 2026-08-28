import type { ExamplePipeline } from './examplePipeline';
import { infiniteLabyrinth } from './infiniteLabyrinth';
import { sunkenLabyrinth } from './sunkenLabyrinth';
import { volcanicIslands } from './volcanicIslands';

export type { ExamplePipeline };

export function examplePipelines(): ExamplePipeline[] {
  return [volcanicIslands(), infiniteLabyrinth(), sunkenLabyrinth()];
}

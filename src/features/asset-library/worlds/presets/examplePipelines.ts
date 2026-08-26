import type { ExamplePipeline } from './examplePipeline';
import { infiniteLabyrinth } from './infiniteLabyrinth';
import { mesaBadlands } from './mesaBadlands';
import { volcanicIslands } from './volcanicIslands';

export type { ExamplePipeline };

export function examplePipelines(): ExamplePipeline[] {
  return [volcanicIslands(), mesaBadlands(), infiniteLabyrinth()];
}

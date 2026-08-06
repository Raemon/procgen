import { Grid } from '../world/grid';
import type { Tileset } from '../world/tiles/tileset';
import { createGenContext } from './genContext';
import { clampWorldSize, type GenParams } from './genParams';
import type { ElevationField } from './genPass';
import { PASSES } from './passes/passPipeline';

export interface GeneratedWorld {
  grid: Grid;
  elevation: ElevationField;
}

export function generate(params: GenParams, tileset: Tileset): GeneratedWorld {
  const size = clampWorldSize(params.size);
  const grid = new Grid(size, size);
  const ctx = createGenContext(params, tileset, size * size);
  for (const pass of PASSES) pass.apply(grid, ctx);
  return { grid, elevation: ctx.elevation };
}

import { fractalNoise } from '../../noise/fractalNoise';
import { hashString } from '../../random/hashString';
import type { Grid } from '../../world/grid';
import type { ElevationField, GenCtx, GenPass } from '../genPass';

const OCTAVES = 4;

export const elevationNoise: GenPass = {
  name: 'elevationNoise',
  apply(grid, ctx) {
    fillWithFractalNoise(grid, ctx);
    rescaleToUnitRange(ctx.elevation);
  },
};

function fillWithFractalNoise(grid: Grid, ctx: GenCtx): void {
  const { seed, noiseScale } = ctx.params;
  const noiseSeed = hashString(`${seed}:elevation`);
  grid.forEach((x, y) => {
    ctx.elevation[grid.indexOf(x, y)] = fractalNoise(
      x * noiseScale,
      y * noiseScale,
      noiseSeed,
      OCTAVES,
    );
  });
}

function rescaleToUnitRange(field: ElevationField): void {
  const { min, max } = extentOf(field);
  const span = max - min || 1;
  for (let i = 0; i < field.length; i++) field[i] = (field[i]! - min) / span;
}

function extentOf(field: ElevationField): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const value of field) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return { min, max };
}

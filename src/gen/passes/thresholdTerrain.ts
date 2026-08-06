import type { GenCtx, GenPass } from '../genPass';

const SAND_BAND_ABOVE_WATERLINE = 0.05;

export const thresholdTerrain: GenPass = {
  name: 'thresholdTerrain',
  apply(grid, ctx) {
    grid.forEach((x, y) => {
      const tileId = terrainTileForElevation(ctx.elevation[grid.indexOf(x, y)]!, ctx);
      if (tileId >= 0) grid.set(x, y, tileId);
    });
  },
};

function terrainTileForElevation(elevation: number, ctx: GenCtx): number {
  const { waterLevel, rockLevel } = ctx.params;
  if (elevation < waterLevel) return ctx.tile('water');
  if (elevation < waterLevel + SAND_BAND_ABOVE_WATERLINE) return ctx.tile('sand');
  if (elevation >= rockLevel) return ctx.tile('rock');
  return ctx.tile('grass');
}

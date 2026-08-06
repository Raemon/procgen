import type { GenPass } from '../genPass';

export const scatterTrees: GenPass = {
  name: 'scatterTrees',
  apply(grid, ctx) {
    const tree = ctx.tile('tree');
    const grass = ctx.tile('grass');
    if (tree < 0 || grass < 0) return;
    const rollPerGrassCell = ctx.rng('trees');
    grid.forEach((x, y, tileId) => {
      if (tileId === grass && rollPerGrassCell() < ctx.params.treeDensity) grid.set(x, y, tree);
    });
  },
};

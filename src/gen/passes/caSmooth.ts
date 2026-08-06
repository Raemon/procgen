import { EMPTY, Grid } from '../../world/grid';
import { clampSmoothingIterations } from '../genParams';
import type { GenPass } from '../genPass';

export const caSmooth: GenPass = {
  name: 'caSmooth',
  apply(grid, ctx) {
    const iterations = clampSmoothingIterations(ctx.params.smoothing);
    const previous = grid.clone();
    for (let i = 0; i < iterations; i++) {
      previous.copyFrom(grid);
      replaceEachTileWithNeighborhoodMajority(grid, previous);
    }
  },
};

function replaceEachTileWithNeighborhoodMajority(grid: Grid, previous: Grid): void {
  grid.forEach((x, y, tileId) => {
    if (tileId === EMPTY) return;
    grid.set(x, y, neighborhoodMajority(previous, x, y, tileId));
  });
}

function neighborhoodMajority(previous: Grid, x: number, y: number, ownTile: number): number {
  return mostVotedFavoringOwnTile(countNeighborhoodTiles(previous, x, y, ownTile), ownTile);
}

function countNeighborhoodTiles(
  previous: Grid,
  x: number,
  y: number,
  offGridStandIn: number,
): Map<number, number> {
  const votes = new Map<number, number>();
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const neighbor = previous.get(x + dx, y + dy);
      const tile = neighbor === EMPTY ? offGridStandIn : neighbor;
      votes.set(tile, (votes.get(tile) ?? 0) + 1);
    }
  }
  return votes;
}

function mostVotedFavoringOwnTile(votes: Map<number, number>, ownTile: number): number {
  let winner = ownTile;
  let winningCount = -1;
  for (const [tile, count] of votes) {
    if (count > winningCount || (count === winningCount && tile === ownTile)) {
      winner = tile;
      winningCount = count;
    }
  }
  return winner;
}

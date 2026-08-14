import type { CellPoint } from '@/features/game/nearestWalkable';
import type { FacingIndex } from '@/features/game/facing';
import type { ElevationProbe } from '@/features/game/climbing';
import type { TouristTrace } from '@/features/asset-library/worlds/walkingSim/touristWalk';

export interface ShotPoint {
  label: string;
  x: number;
  y: number;
  facing: FacingIndex;
}

export function shotPointsOf(trace: TouristTrace, elevationAt: ElevationProbe): ShotPoint[] {
  const spawn = trace.spawn;
  const vantage = highestCellOf(trace.path, elevationAt);
  const frontier = farthestFromSpawn(trace);
  return [
    { label: 'spawn', ...spawn, facing: facingToward(spawn, frontier) },
    { label: 'vantage', ...vantage, facing: facingToward(vantage, spawn) },
    { label: 'frontier', ...frontier, facing: facingToward(frontier, spawn) },
  ];
}

function highestCellOf(path: readonly CellPoint[], elevationAt: ElevationProbe): CellPoint {
  let best = path[0]!;
  let bestElevation = elevationAt(best.x, best.y);
  for (const cell of path) {
    const elevation = elevationAt(cell.x, cell.y);
    if (elevation > bestElevation) {
      best = cell;
      bestElevation = elevation;
    }
  }
  return best;
}

function farthestFromSpawn(trace: TouristTrace): CellPoint {
  let best = trace.spawn;
  let bestSpan = 0;
  for (const cell of trace.path) {
    const span = Math.max(Math.abs(cell.x - trace.spawn.x), Math.abs(cell.y - trace.spawn.y));
    if (span > bestSpan) {
      best = cell;
      bestSpan = span;
    }
  }
  return best;
}

function facingToward(from: CellPoint, to: CellPoint): FacingIndex {
  const angle = Math.atan2(to.x - from.x, -(to.y - from.y));
  const eighth = Math.round(angle / (Math.PI / 4));
  return (((eighth % 8) + 8) % 8) as FacingIndex;
}

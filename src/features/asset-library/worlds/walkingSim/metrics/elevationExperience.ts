import type { CellPoint } from '@/features/game/nearestWalkable';
import { CARDINAL_STEPS } from '../cellGrid';
import type { TouristTrace } from '../touristWalk';
import type { StepProbe, WalkableProbe } from '../worldProbes';
import { meanOf, shareOf } from './meanOf';

const FLAT_STEP_EFFORT = 1;
const LARGEST_CLIMB_RATIO = 5;

export interface ElevationExperience {
  elevationGateShare: number;
  climbRevealRatio: number;
}

export interface ElevationProbes {
  isWalkableAt: WalkableProbe;
  canStep: StepProbe;
}

export function elevationExperience(
  trace: TouristTrace,
  probes: ElevationProbes,
): ElevationExperience {
  return {
    elevationGateShare: gateShareAlong(trace.path, probes),
    climbRevealRatio: climbRevealRatioOf(trace),
  };
}

function gateShareAlong(path: readonly CellPoint[], probes: ElevationProbes): number {
  let walkable = 0;
  let gated = 0;
  for (const cell of path) {
    for (const step of CARDINAL_STEPS) {
      const next = { x: cell.x + step.dx, y: cell.y + step.dy };
      if (!probes.isWalkableAt(next.x, next.y)) continue;
      walkable++;
      if (!probes.canStep(cell.x, cell.y, next.x, next.y)) gated++;
    }
  }
  return shareOf(gated, walkable);
}

function climbRevealRatioOf(trace: TouristTrace): number {
  const climbs = trace.climbEffortPerStep
    .map((effort, step) => ({ effort, revealed: trace.revealPerStep[step] ?? 0 }))
    .filter((each) => each.effort > FLAT_STEP_EFFORT);
  if (climbs.length === 0) return 0;
  const climbYield =
    climbs.reduce((sum, each) => sum + each.revealed, 0) /
    climbs.reduce((sum, each) => sum + each.effort, 0);
  const flatPace = Math.max(meanOf(trace.revealPerStep), 0.001);
  return Math.min(LARGEST_CLIMB_RATIO, climbYield / flatPace);
}

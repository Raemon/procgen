import type { WorldViewDeps } from '../../worldViewDeps';
import type { CoveredCells } from './coveredCells';
import type { DoorOpenings } from './doorOpenings';
import { WorldAnimations } from './worldAnimations';

export interface PuzzleAnimationDeps {
  puzzleCues: WorldViewDeps['puzzleCues'];
  doors: DoorOpenings;
  covered: CoveredCells;
}

export function puzzleAnimationsOf(deps: PuzzleAnimationDeps): WorldAnimations {
  const animations = new WorldAnimations();
  const doors = animations.add(deps.doors);
  animations.whenDisposed(deps.puzzleCues.on('door-opened', (cells) => doors.open(cells)));
  return animations;
}

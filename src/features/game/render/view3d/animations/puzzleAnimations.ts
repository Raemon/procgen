import type * as THREE from 'three';
import type { WorldViewDeps } from '../../worldViewDeps';
import type { CoveredCells } from './coveredCells';
import { DoorOpenings } from './doorOpenings';
import { WorldAnimations } from './worldAnimations';

export interface PuzzleAnimationDeps {
  puzzleCues: WorldViewDeps['puzzleCues'];
  surfaceAt: WorldViewDeps['surfaceAt'];
  covered: CoveredCells;
}

export function puzzleAnimationsOf(root: THREE.Group, deps: PuzzleAnimationDeps): WorldAnimations {
  const animations = new WorldAnimations();
  const doors = animations.add(new DoorOpenings(root, deps.surfaceAt));
  animations.whenDisposed(deps.puzzleCues.on('door-opened', (cells) => doors.open(cells)));
  return animations;
}

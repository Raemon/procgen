import type * as THREE from 'three';
import type { WorldViewDeps } from '../../worldViewDeps';
import type { CoveredCells } from './coveredCells';
import { CrateSlides } from './crateSlides';
import { DoorOpenings } from './doorOpenings';
import { WorldAnimations } from './worldAnimations';

export interface PuzzleAnimationDeps {
  puzzleCues: WorldViewDeps['puzzleCues'];
  surfaceAt: WorldViewDeps['surfaceAt'];
  elevationAt: (x: number, y: number) => number;
  crates: WorldViewDeps['overlay'];
  covered: CoveredCells;
}

export function puzzleAnimationsOf(root: THREE.Group, deps: PuzzleAnimationDeps): WorldAnimations {
  const animations = new WorldAnimations();
  const doors = animations.add(new DoorOpenings(root, deps.surfaceAt));
  animations.whenDisposed(deps.puzzleCues.on('door-opened', (cells) => doors.open(cells)));
  const crates = animations.add(
    new CrateSlides(root, {
      crates: deps.crates,
      covered: deps.covered,
      elevationAt: deps.elevationAt,
    }),
  );
  animations.whenDisposed(deps.puzzleCues.on('crate-pushed', (pushes) => crates.shove(pushes)));
  return animations;
}

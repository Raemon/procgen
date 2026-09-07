import type * as THREE from 'three';
import type { WorldViewDeps } from '../../worldViewDeps';
import type { CoveredCells } from './coveredCells';
import { CrateSlides } from './crateSlides';
import type { DoorOpenings } from './doorOpenings';
import { WorldAnimations } from './worldAnimations';

export interface PuzzleAnimationDeps {
  puzzleCues: WorldViewDeps['puzzleCues'];
  doors: DoorOpenings;
  root: THREE.Group;
  elevationAt: (x: number, y: number) => number;
  crates: WorldViewDeps['overlay'];
  covered: CoveredCells;
}

export function puzzleAnimationsOf(deps: PuzzleAnimationDeps): WorldAnimations {
  const animations = new WorldAnimations();
  const doors = animations.add(deps.doors);
  animations.whenDisposed(deps.puzzleCues.on('door-opened', (cells) => doors.open(cells)));
  const crates = animations.add(
    new CrateSlides(deps.root, {
      crates: deps.crates,
      covered: deps.covered,
      elevationAt: deps.elevationAt,
    }),
  );
  animations.whenDisposed(deps.puzzleCues.on('crate-pushed', (pushes) => crates.shove(pushes)));
  return animations;
}

import { facingVector, turnedFacing, type FacingIndex } from '../facing';
import type { Step } from './cameraRelativeStep';

export function facingRelativeStep(
  facing: FacingIndex,
  forwardInput: number,
  strafeInput: number,
): Step {
  const forward = facingVector(facing);
  const right = facingVector(turnedFacing(facing, 2));
  return [
    clampToSingleTile(forwardInput * forward.dx + strafeInput * right.dx),
    clampToSingleTile(forwardInput * forward.dy + strafeInput * right.dy),
  ];
}

function clampToSingleTile(delta: number): number {
  return Math.max(-1, Math.min(1, delta));
}

import { EAST_FACE, visibleFacesOf } from '../render/view3d/culling/visibleFaceMask';
import { occluderFieldOfPlacements } from '../render/view3d/culling/occluderFieldOfPlacements';
import { floorShape } from '../render/view3d/tileShapes';
import type { TilePlacement } from '../render/view3d/tilePlacements';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const WINDOW = { originX: 0, originY: 0, span: 3 };
const HILLTOP = 5;

export function checkGroundHidesWhatIsUnderIt(check: CheckReporter): void {
  const uphill = groundAt(1, 1, HILLTOP);
  const oneStepDown = groundAt(2, 1, HILLTOP - 1);
  check(
    'ground reaches down to a neighbour a step below it, so an incline has no gap to see under',
    groundBoxOf(uphill).bottom <= oneStepDown.elevation,
  );
  check(
    'ground touching ground at the same height still hides the face between them',
    (facesDrawnOf(uphill, [uphill, groundAt(2, 1, HILLTOP)]) & EAST_FACE) === 0,
  );
  check(
    'ground on the high side of a step still draws the face it exposes',
    (facesDrawnOf(uphill, [uphill, oneStepDown]) & EAST_FACE) !== 0,
  );
}

function facesDrawnOf(placement: TilePlacement, around: readonly TilePlacement[]): number {
  const field = occluderFieldOfPlacements(WINDOW, [{ placements: around, shape: floorShape() }]);
  return visibleFacesOf(field, placement.x, placement.y, groundBoxOf(placement));
}

function groundBoxOf(placement: TilePlacement) {
  return floorShape().occluderBoxOf!(placement);
}

function groundAt(x: number, y: number, elevation: number): TilePlacement {
  return {
    x,
    y,
    elevation,
    height: 1,
    baseColor: '#6d8a55',
    shade: 1,
    faceArt: null,
    textureId: null,
    glow: 0,
    sunkenAsWater: false,
    shape: 'cube',
    facing: 0,
  };
}

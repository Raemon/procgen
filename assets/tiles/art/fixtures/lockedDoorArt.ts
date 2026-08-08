import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { darken, lighten } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { plankPainter } from '../painters/plankPainter';
import {
  beveledRectPainter,
  barPainter,
  discPainter,
  rectPainter,
  ringPainter,
  type PixelPoint,
  type PixelRect,
} from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import {
  DOOR_LEAF,
  DOOR_TOP_BAND,
  doorFramePainter,
  doorFrameReliefPainter,
  doorTopFacePainter,
  doorTopReliefPainter,
  doorUndersidePainter,
} from './doorFrame';
import { DOOR_IRON, DOOR_TIMBER, doorLeafPainter, doorLeafReliefPainter } from './doorLeaf';

const LOCK_PLATE: PixelRect = { left: 19, top: 12, width: 9, height: 9 };
const KEYHOLE: PixelPoint = { x: 23.5, y: 15.5 };
const PULL_RING: PixelPoint = { x: 13, y: 16 };
const RING_BRASS = '#b08432';
const KEYHOLE_DARK = '#100e0c';
const LEAF = { within: DOOR_LEAF, seed: 0xd001 };

export function lockedDoorFaceArt(): CubeFaceArt {
  return cubeArtFrom(
    SIZE,
    {
      top: doorTopFacePainter(closedDoorFromAbovePainter(), 0xd002),
      sides: lockedDoorFacePainter(),
      bottom: doorUndersidePainter(),
    },
    { top: doorTopReliefPainter(0.62), sides: lockedDoorReliefPainter() },
  );
}

function lockedDoorFacePainter(): PixelPainter {
  return stackedPainters(
    doorFramePainter(0xd003),
    doorLeafPainter(LEAF),
    pullRingPainter(),
    lockPlatePainter(),
  );
}

function lockedDoorReliefPainter(): PixelPainter {
  return stackedPainters(
    doorFrameReliefPainter(),
    doorLeafReliefPainter(LEAF),
    ringPainter(PULL_RING, 4.5, 2.8, heightInk(0.94)),
    rectPainter(LOCK_PLATE, heightInk(0.86)),
    keyholePainter(heightInk(0.18), heightInk(0.18)),
  );
}

function pullRingPainter(): PixelPainter {
  return stackedPainters(
    discPainter(PULL_RING, 3, darken(RING_BRASS, 0.45)),
    ringPainter(PULL_RING, 4.5, 2.8, RING_BRASS),
    ringPainter({ x: PULL_RING.x - 0.6, y: PULL_RING.y - 0.8 }, 4.2, 3.4, lighten(RING_BRASS, 0.3)),
  );
}

function lockPlatePainter(): PixelPainter {
  return stackedPainters(
    beveledRectPainter(LOCK_PLATE, lighten(DOOR_IRON, 0.1), 0.3),
    keyholePainter(KEYHOLE_DARK, darken(KEYHOLE_DARK, 0.2)),
  );
}

function keyholePainter(bore: string, slot: string): PixelPainter {
  return stackedPainters(
    discPainter(KEYHOLE, 2, bore),
    barPainter(KEYHOLE, { x: KEYHOLE.x, y: KEYHOLE.y + 3.5 }, 2, slot),
  );
}

function closedDoorFromAbovePainter(): PixelPainter {
  const endGrain = plankPainter({
    base: darken(DOOR_TIMBER, 0.18),
    seam: '#2f1d0e',
    seed: 0xd004,
    size: SIZE,
    plankHeight: 5,
    plankLength: SIZE,
  });
  return stackedPainters(endGrain, ...ironEdgeStrips());
}

function ironEdgeStrips(): PixelPainter[] {
  const top = { left: 0, top: DOOR_TOP_BAND.top, width: SIZE, height: 2 };
  const bottom = { ...top, top: DOOR_TOP_BAND.top + DOOR_TOP_BAND.height - 2 };
  return [top, bottom].map((strip) => rectPainter(strip, DOOR_IRON));
}

import { heightInk } from '../../faceArtHeight';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { darken, shadedRamp } from '../colorMath';
import { patchPainter, specklePainter } from '../painters/grainPainters';
import {
  beveledRectPainter,
  discPainter,
  rectPainter,
  type PixelPoint,
  type PixelRect,
} from '../painters/shapePainters';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';

export const LEVER_PIVOT: PixelPoint = { x: 16, y: 20 };
export const LEVER_TOP_PIVOT: PixelPoint = { x: 16, y: 16 };

const SIDE_PLATE: PixelRect = { left: 8, top: 9, width: 16, height: 15 };
const TOP_PLATE: PixelRect = { left: 8, top: 8, width: 16, height: 16 };
const HANDLE_SLOT: PixelRect = { left: 15, top: 11, width: 2, height: 9 };
const PLATE_IRON = '#4a5058';
const BOLT = '#9199a2';
const BACKING_STONE = '#5c584f';
const BOLT_RADIUS = 1.6;
const BACKING_RELIEF = 0.34;
const PLATE_RELIEF = 0.62;
const BOLT_RELIEF = 0.8;

export function leverBackingPainter(seed: number): PixelPainter {
  return stackedPainters(
    patchPainter(shadedRamp(BACKING_STONE, 5, 0.16), { seed, cell: 16, size: SIZE }),
    specklePainter(darken(BACKING_STONE, 0.25), seed ^ 0x19, 0.09),
  );
}

export function leverSidePlatePainter(): PixelPainter {
  return platePainter(SIDE_PLATE, rectPainter(HANDLE_SLOT, darken(PLATE_IRON, 0.6)));
}

export function leverTopPlatePainter(): PixelPainter {
  return platePainter(TOP_PLATE, discPainter(LEVER_TOP_PIVOT, 2.5, darken(PLATE_IRON, 0.6)));
}

export function leverSideReliefPainter(): PixelPainter {
  return stackedPainters(
    plateReliefPainter(SIDE_PLATE),
    rectPainter(HANDLE_SLOT, heightInk(0.3)),
  );
}

export function leverTopReliefPainter(): PixelPainter {
  return stackedPainters(
    plateReliefPainter(TOP_PLATE),
    discPainter(LEVER_TOP_PIVOT, 2.5, heightInk(0.3)),
  );
}

function platePainter(plate: PixelRect, recess: PixelPainter): PixelPainter {
  return stackedPainters(
    beveledRectPainter(plate, PLATE_IRON, 0.28),
    recess,
    ...boltsOf(plate).map((bolt) => boltPainter(bolt)),
  );
}

function plateReliefPainter(plate: PixelRect): PixelPainter {
  return stackedPainters(
    flatPainter(heightInk(BACKING_RELIEF)),
    rectPainter(plate, heightInk(PLATE_RELIEF)),
    ...boltsOf(plate).map((bolt) => discPainter(bolt, BOLT_RADIUS, heightInk(BOLT_RELIEF))),
  );
}

function boltPainter(bolt: PixelPoint): PixelPainter {
  return stackedPainters(
    discPainter(bolt, BOLT_RADIUS, darken(BOLT, 0.45)),
    discPainter({ x: bolt.x - 0.5, y: bolt.y - 0.5 }, BOLT_RADIUS - 0.8, BOLT),
  );
}

function boltsOf(plate: PixelRect): PixelPoint[] {
  const [left, right] = [plate.left + 2, plate.left + plate.width - 3];
  const [top, bottom] = [plate.top + 2, plate.top + plate.height - 3];
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: left, y: bottom },
    { x: right, y: bottom },
  ];
}

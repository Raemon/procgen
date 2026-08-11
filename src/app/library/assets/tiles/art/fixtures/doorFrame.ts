import { heightInk } from '../../faceArtHeight';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { darken, shadedRamp } from '../colorMath';
import { patchPainter, specklePainter } from '../painters/grainPainters';
import {
  clippedOutsideRect,
  clippedToRect,
  rectPainter,
  type PixelRect,
} from '../painters/shapePainters';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';

export const DOOR_LEAF: PixelRect = { left: 3, top: 2, width: 26, height: 30 };
export const DOOR_TOP_BAND: PixelRect = { left: 0, top: 11, width: SIZE, height: 10 };

const FRAME_STONE = '#6c675f';
const FRAME_RELIEF = 0.4;

export function doorFramePainter(seed: number): PixelPainter {
  return clippedOutsideRect(DOOR_LEAF, frameStonePainter(seed));
}

export function doorFrameReliefPainter(): PixelPainter {
  return clippedOutsideRect(DOOR_LEAF, flatPainter(heightInk(FRAME_RELIEF)));
}

export function doorTopFacePainter(acrossTheDoorway: PixelPainter, seed: number): PixelPainter {
  return stackedPainters(frameStonePainter(seed), clippedToRect(DOOR_TOP_BAND, acrossTheDoorway));
}

export function doorTopReliefPainter(doorwayRelief: number): PixelPainter {
  return stackedPainters(
    flatPainter(heightInk(FRAME_RELIEF)),
    rectPainter(DOOR_TOP_BAND, heightInk(doorwayRelief)),
  );
}

export function doorUndersidePainter(): PixelPainter {
  return flatPainter('#26221d');
}

function frameStonePainter(seed: number): PixelPainter {
  return stackedPainters(
    patchPainter(shadedRamp(FRAME_STONE, 5, 0.18), { seed, cell: 16, size: SIZE }),
    specklePainter(darken(FRAME_STONE, 0.22), seed ^ 0x21, 0.08),
    specklePainter(darken(FRAME_STONE, 0.4), seed ^ 0x37, 0.03),
  );
}

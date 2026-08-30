import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { darken, lighten } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { plankPainter } from '../painters/plankPainter';
import { beveledRectPainter, rectPainter, type PixelRect } from '../painters/shapePainters';
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

const DRAW_BAR: PixelRect = { left: 1, top: 15, width: 30, height: 4 };
const LEFT_BRACKET: PixelRect = { left: 1, top: 13, width: 4, height: 8 };
const RIGHT_BRACKET: PixelRect = { left: 27, top: 13, width: 4, height: 8 };
const BAR_HIGHLIGHT: PixelRect = { left: 1, top: 15, width: 30, height: 1 };
const LEAF = { within: DOOR_LEAF, seed: 0xb001 };

export function barredDoorFaceArt(): CubeFaceArt {
  return cubeArtFrom(
    SIZE,
    {
      top: doorTopFacePainter(barredDoorFromAbovePainter(), 0xb002),
      sides: barredDoorFacePainter(),
      bottom: doorUndersidePainter(),
    },
    { top: doorTopReliefPainter(0.62), sides: barredDoorReliefPainter() },
  );
}

function barredDoorFacePainter(): PixelPainter {
  return stackedPainters(
    doorFramePainter(0xb003),
    doorLeafPainter(LEAF),
    drawBarPainter(),
  );
}

function barredDoorReliefPainter(): PixelPainter {
  return stackedPainters(
    doorFrameReliefPainter(),
    doorLeafReliefPainter(LEAF),
    rectPainter(DRAW_BAR, heightInk(0.9)),
    rectPainter(LEFT_BRACKET, heightInk(0.96)),
    rectPainter(RIGHT_BRACKET, heightInk(0.96)),
  );
}

function drawBarPainter(): PixelPainter {
  return stackedPainters(
    beveledRectPainter(DRAW_BAR, DOOR_IRON, 0.3),
    rectPainter(BAR_HIGHLIGHT, lighten(DOOR_IRON, 0.35)),
    beveledRectPainter(LEFT_BRACKET, lighten(DOOR_IRON, 0.12), 0.35),
    beveledRectPainter(RIGHT_BRACKET, lighten(DOOR_IRON, 0.12), 0.35),
  );
}

function barredDoorFromAbovePainter(): PixelPainter {
  const endGrain = plankPainter({
    base: darken(DOOR_TIMBER, 0.18),
    seam: '#2f1d0e',
    seed: 0xb004,
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

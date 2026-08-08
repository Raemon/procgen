import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { darken, lighten, mixHex } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { specklePainter } from '../painters/grainPainters';
import { plankPainter } from '../painters/plankPainter';
import { clippedToRect, rectPainter, type PixelRect } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import {
  DOOR_TOP_BAND,
  doorFramePainter,
  doorFrameReliefPainter,
  doorTopFacePainter,
  doorTopReliefPainter,
  doorUndersidePainter,
} from './doorFrame';
import { DOOR_TIMBER, doorLeafPainter, doorLeafReliefPainter } from './doorLeaf';

const SWUNG_LEAF: PixelRect = { left: 3, top: 2, width: 8, height: 30 };
const OPENING: PixelRect = { left: 11, top: 2, width: 18, height: 30 };
const THRESHOLD: PixelRect = { left: 11, top: 28, width: 18, height: 4 };
const LEAF_LIT_EDGE: PixelRect = { left: 10, top: 2, width: 1, height: 30 };
const MOUTH_DARK = '#0d0b09';
const THRESHOLD_STONE = '#4c463d';
const LEAF = { within: SWUNG_LEAF, seed: 0xd101 };

export function openDoorwayFaceArt(): CubeFaceArt {
  return cubeArtFrom(
    SIZE,
    {
      top: doorTopFacePainter(openDoorFromAbovePainter(), 0xd102),
      sides: openDoorwayFacePainter(),
      bottom: doorUndersidePainter(),
    },
    { top: openDoorTopReliefPainter(), sides: openDoorwayReliefPainter() },
  );
}

function openDoorwayFacePainter(): PixelPainter {
  return stackedPainters(
    doorFramePainter(0xd103),
    thresholdPainter(),
    doorLeafPainter(LEAF),
    rectPainter(LEAF_LIT_EDGE, lighten(DOOR_TIMBER, 0.35)),
  );
}

function openDoorwayReliefPainter(): PixelPainter {
  return stackedPainters(
    doorFrameReliefPainter(),
    rectPainter(THRESHOLD, heightInk(0.12)),
    doorLeafReliefPainter(LEAF),
  );
}

function thresholdPainter(): PixelPainter {
  return clippedToRect(
    THRESHOLD,
    stackedPainters(
      (_x, y) => mixHex(THRESHOLD_STONE, MOUTH_DARK, (THRESHOLD.top + THRESHOLD.height - y) / 6),
      specklePainter(lighten(THRESHOLD_STONE, 0.15), 0xd105, 0.08),
    ),
  );
}

function openDoorFromAbovePainter(): PixelPainter {
  const endGrain = plankPainter({
    base: darken(DOOR_TIMBER, 0.18),
    seam: '#2f1d0e',
    seed: 0xd106,
    size: SIZE,
    plankHeight: 5,
    plankLength: SIZE,
  });
  return stackedPainters(rectPainter(DOOR_TOP_BAND, MOUTH_DARK), clippedToRect(leafFromAbove(), endGrain));
}

function openDoorTopReliefPainter(): PixelPainter {
  return stackedPainters(
    doorTopReliefPainter(0.06),
    rectPainter(leafFromAbove(), heightInk(0.55)),
  );
}

function leafFromAbove(): PixelRect {
  return { left: 0, top: DOOR_TOP_BAND.top, width: OPENING.left, height: DOOR_TOP_BAND.height };
}

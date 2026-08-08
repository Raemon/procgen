import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { darken, lighten } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { barPainter, discPainter, ringPainter, type PixelPoint } from '../painters/shapePainters';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';
import {
  LEVER_PIVOT,
  LEVER_TOP_PIVOT,
  leverBackingPainter,
  leverSidePlatePainter,
  leverSideReliefPainter,
  leverTopPlatePainter,
  leverTopReliefPainter,
} from './leverPlate';

interface HandleShape {
  from: PixelPoint;
  to: PixelPoint;
  knobRadius: number;
}

interface LeverPose {
  side: HandleShape;
  top: HandleShape;
  metal: string;
  litRing: string | null;
}

const IDLE_METAL = '#8d949c';
const THROWN_METAL = '#c9a24a';
const LIT_RING = '#7fdc6a';
const HANDLE_THICKNESS = 3.4;

export function leverIdleFaceArt(): CubeFaceArt {
  return leverFaceArt({
    side: { from: LEVER_PIVOT, to: { x: 16, y: 5 }, knobRadius: 2.8 },
    top: { from: LEVER_TOP_PIVOT, to: { x: 16, y: 13 }, knobRadius: 3.2 },
    metal: IDLE_METAL,
    litRing: null,
  });
}

export function leverThrownFaceArt(): CubeFaceArt {
  return leverFaceArt({
    side: { from: LEVER_PIVOT, to: { x: 27, y: 25 }, knobRadius: 3 },
    top: { from: LEVER_TOP_PIVOT, to: { x: 26, y: 25 }, knobRadius: 3 },
    metal: THROWN_METAL,
    litRing: LIT_RING,
  });
}

function leverFaceArt(pose: LeverPose): CubeFaceArt {
  return cubeArtFrom(
    SIZE,
    {
      top: leverFacePainter(leverTopPlatePainter(), pose, pose.top, LEVER_TOP_PIVOT, 0xe001),
      sides: leverFacePainter(leverSidePlatePainter(), pose, pose.side, LEVER_PIVOT, 0xe002),
      bottom: flatPainter('#26221d'),
    },
    {
      top: stackedPainters(leverTopReliefPainter(), handleReliefPainter(pose.top)),
      sides: stackedPainters(leverSideReliefPainter(), handleReliefPainter(pose.side)),
    },
  );
}

function leverFacePainter(
  plate: PixelPainter,
  pose: LeverPose,
  handle: HandleShape,
  pivot: PixelPoint,
  seed: number,
): PixelPainter {
  return stackedPainters(
    leverBackingPainter(seed),
    plate,
    litRingPainter(pose, pivot),
    handlePainter(handle, pose.metal),
  );
}

function handlePainter(handle: HandleShape, metal: string): PixelPainter {
  return stackedPainters(
    barPainter(handle.from, handle.to, HANDLE_THICKNESS, darken(metal, 0.42)),
    barPainter(handle.from, handle.to, HANDLE_THICKNESS - 2, metal),
    discPainter(handle.to, handle.knobRadius, darken(metal, 0.2)),
    discPainter(shiftedTowardsLight(handle.to), handle.knobRadius - 1.4, lighten(metal, 0.32)),
  );
}

function handleReliefPainter(handle: HandleShape): PixelPainter {
  return stackedPainters(
    barPainter(handle.from, handle.to, HANDLE_THICKNESS, heightInk(0.9)),
    discPainter(handle.to, handle.knobRadius, heightInk(1)),
  );
}

function litRingPainter(pose: LeverPose, pivot: PixelPoint): PixelPainter {
  if (!pose.litRing) return () => null;
  return stackedPainters(
    ringPainter(pivot, 4.4, 2.6, darken(pose.litRing, 0.35)),
    ringPainter(pivot, 3.8, 3, pose.litRing),
  );
}

function shiftedTowardsLight(point: PixelPoint): PixelPoint {
  return { x: point.x - 0.7, y: point.y - 0.9 };
}

import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { darken, lighten, shadedRamp } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { patchPainter, specklePainter } from '../painters/grainPainters';
import {
  beveledRectPainter,
  convexPolygonPainter,
  discPainter,
  rectPainter,
  ringPainter,
  type PixelPoint,
  type PixelRect,
} from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';

const SOCKET_STONE = '#4c4740';
const SLAB_IRON = '#5b6068';
const WAITING_SIGNAL = '#f0b043';
const PRESSED_SIGNAL = '#6fe08a';
const CENTRE: PixelPoint = { x: 16, y: 16 };
const SLAB: PixelRect = { left: 2, top: 2, width: 28, height: 28 };
const ARROW_TIP_FROM_CENTRE = 7.5;
const ARROW_TAIL_FROM_CENTRE = 12.5;
const ARROW_HALF_WIDTH = 3.2;
const RIM_OUTER = 14.5;
const RIM_INNER = 12;
const SOCKET_OUTER = 7;
const SOCKET_INNER = 4.6;
const RIM_BAND: PixelRect = { left: 0, top: 0, width: SIZE, height: SIZE };
const SIGNAL_BAND: PixelRect = { left: 0, top: 0, width: SIZE, height: 14 };

interface PlatePose {
  signal: string;
  slabRelief: number;
  glowing: boolean;
}

export function plateWaitingFaceArt(): CubeFaceArt {
  return plateFaceArt({ signal: WAITING_SIGNAL, slabRelief: 0.62, glowing: false });
}

export function platePressedFaceArt(): CubeFaceArt {
  return plateFaceArt({ signal: PRESSED_SIGNAL, slabRelief: 0.4, glowing: true });
}

function plateFaceArt(pose: PlatePose): CubeFaceArt {
  return cubeArtFrom(
    SIZE,
    { top: plateTopPainter(pose), sides: plateRimPainter(pose), bottom: plateUnderPainter() },
    { top: plateTopReliefPainter(pose), sides: plateRimReliefPainter(pose) },
  );
}

function plateTopPainter(pose: PlatePose): PixelPainter {
  return stackedPainters(
    socketStonePainter(),
    beveledRectPainter(SLAB, SLAB_IRON, 0.32),
    ringPainter(CENTRE, RIM_OUTER, RIM_INNER, darken(pose.signal, 0.55)),
    ringPainter(CENTRE, RIM_OUTER - 1, RIM_INNER + 0.6, pose.signal),
    ...inwardArrowPainters(darken(pose.signal, 0.5), pose.signal),
    socketPainter(pose),
  );
}

function plateTopReliefPainter(pose: PlatePose): PixelPainter {
  return stackedPainters(
    () => heightInk(0.3),
    rectPainter(SLAB, heightInk(pose.slabRelief)),
    ringPainter(CENTRE, RIM_OUTER, RIM_INNER, heightInk(pose.slabRelief + 0.2)),
    ...inwardArrowPainters(heightInk(pose.slabRelief + 0.12), heightInk(pose.slabRelief + 0.12)),
    discPainter(CENTRE, SOCKET_OUTER, heightInk(pose.slabRelief - 0.22)),
    discPainter(CENTRE, SOCKET_INNER - 1.4, heightInk(pose.glowing ? pose.slabRelief : 0.28)),
  );
}

function socketStonePainter(): PixelPainter {
  return stackedPainters(
    patchPainter(shadedRamp(SOCKET_STONE, 5, 0.16), { seed: 0x51a5, cell: 16, size: SIZE }),
    specklePainter(darken(SOCKET_STONE, 0.24), 0x51a7, 0.08),
  );
}

function socketPainter(pose: PlatePose): PixelPainter {
  const well = pose.glowing ? lighten(pose.signal, 0.35) : darken(pose.signal, 0.62);
  return stackedPainters(
    ringPainter(CENTRE, SOCKET_OUTER, SOCKET_INNER, darken(pose.signal, 0.4)),
    discPainter(CENTRE, SOCKET_INNER, darken(SLAB_IRON, 0.45)),
    discPainter(CENTRE, SOCKET_INNER - 1.4, well),
  );
}

function inwardArrowPainters(edge: string, face: string): PixelPainter[] {
  return [0, 1, 2, 3].flatMap((quarter) => [
    convexPolygonPainter(arrowCornersFacing(quarter, 0), edge),
    convexPolygonPainter(arrowCornersFacing(quarter, 1), face),
  ]);
}

function arrowCornersFacing(quarter: number, inset: number): PixelPoint[] {
  const corners = [
    { along: ARROW_TIP_FROM_CENTRE + inset, across: 0 },
    { along: ARROW_TAIL_FROM_CENTRE - inset, across: -(ARROW_HALF_WIDTH - inset) },
    { along: ARROW_TAIL_FROM_CENTRE - inset, across: ARROW_HALF_WIDTH - inset },
  ];
  return corners.map(({ along, across }) => pointAtQuarter(quarter, along, across));
}

function pointAtQuarter(quarter: number, along: number, across: number): PixelPoint {
  const turns: [number, number][] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  const [awayX, awayY] = turns[quarter]!;
  return { x: CENTRE.x + awayX * along - awayY * across, y: CENTRE.y + awayY * along + awayX * across };
}

function plateRimPainter(pose: PlatePose): PixelPainter {
  return stackedPainters(
    socketStonePainter(),
    rectPainter(RIM_BAND, darken(SLAB_IRON, 0.25)),
    rectPainter(SIGNAL_BAND, darken(pose.signal, 0.35)),
    rectPainter({ ...SIGNAL_BAND, height: 6 }, pose.signal),
  );
}

function plateRimReliefPainter(pose: PlatePose): PixelPainter {
  return stackedPainters(
    () => heightInk(0.4),
    rectPainter(RIM_BAND, heightInk(pose.slabRelief)),
    rectPainter(SIGNAL_BAND, heightInk(pose.slabRelief + 0.15)),
  );
}

function plateUnderPainter(): PixelPainter {
  return () => '#221f1b';
}

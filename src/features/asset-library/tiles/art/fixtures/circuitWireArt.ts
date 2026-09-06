import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { animatedCubeArt } from '../cubeArtFrom';
import { barPainter, discPainter, type PixelPoint } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';

export const WIRE_NORTH = 1;
export const WIRE_EAST = 2;
export const WIRE_SOUTH = 4;
export const WIRE_WEST = 8;

export const DARK_WIRE_INK = '#4a6b80';
export const LIT_WIRE_INK = '#6fe08a';

const DARK_CASING = '#1a232b';
const LIT_CASING = '#1f6b42';
const LIT_SURGE = '#b4ffc6';
const CASING_THICKNESS = 4;
const CORE_THICKNESS = 2;
const NODE_RADIUS = 3.2;
const CENTRE: PixelPoint = { x: (SIZE - 1) / 2, y: (SIZE - 1) / 2 };
const PULSE_MS = 420;
const STRAIGHT_MASKS = [WIRE_NORTH | WIRE_SOUTH, WIRE_EAST | WIRE_WEST];

const EDGE_MIDPOINTS: Record<number, PixelPoint> = {
  [WIRE_NORTH]: { x: CENTRE.x, y: -1 },
  [WIRE_EAST]: { x: SIZE, y: CENTRE.y },
  [WIRE_SOUTH]: { x: CENTRE.x, y: SIZE },
  [WIRE_WEST]: { x: -1, y: CENTRE.y },
};

interface WireTone {
  casing: string;
  core: string;
}

const wireArt = new Map<string, CubeFaceArt>();

export function wireFaceArt(mask: number, lit: boolean): CubeFaceArt {
  const key = `${mask}:${lit}`;
  const known = wireArt.get(key);
  if (known) return known;
  const art = lit ? litWireArt(mask) : darkWireArt(mask);
  wireArt.set(key, art);
  return art;
}

function darkWireArt(mask: number): CubeFaceArt {
  return animatedCubeArt(SIZE, [wireFrame(mask, { casing: DARK_CASING, core: DARK_WIRE_INK })]);
}

function litWireArt(mask: number): CubeFaceArt {
  return animatedCubeArt(
    SIZE,
    [
      wireFrame(mask, { casing: LIT_CASING, core: LIT_WIRE_INK }),
      wireFrame(mask, { casing: LIT_CASING, core: LIT_SURGE }),
    ],
    PULSE_MS,
  );
}

function wireFrame(mask: number, tone: WireTone) {
  return {
    color: { top: wireTopPainter(mask, tone), sides: unpainted, bottom: unpainted },
    height: { top: wireReliefPainter(mask) },
  };
}

function wireTopPainter(mask: number, tone: WireTone): PixelPainter {
  return stackedPainters(
    ...armsOf(mask).map((end) => barPainter(CENTRE, end, CASING_THICKNESS, tone.casing)),
    ...nodePainters(mask, NODE_RADIUS, tone.casing),
    ...armsOf(mask).map((end) => barPainter(CENTRE, end, CORE_THICKNESS, tone.core)),
    ...nodePainters(mask, NODE_RADIUS - 1.2, tone.core),
  );
}

function wireReliefPainter(mask: number): PixelPainter {
  return stackedPainters(
    ...armsOf(mask).map((end) => barPainter(CENTRE, end, CASING_THICKNESS, heightInk(0.6))),
    ...armsOf(mask).map((end) => barPainter(CENTRE, end, CORE_THICKNESS, heightInk(0.72))),
    ...nodePainters(mask, NODE_RADIUS, heightInk(0.7)),
  );
}

function armsOf(mask: number): PixelPoint[] {
  return [WIRE_NORTH, WIRE_EAST, WIRE_SOUTH, WIRE_WEST]
    .filter((side) => (mask & side) !== 0)
    .map((side) => EDGE_MIDPOINTS[side]!);
}

function nodePainters(mask: number, radius: number, ink: string): PixelPainter[] {
  return STRAIGHT_MASKS.includes(mask) ? [] : [discPainter(CENTRE, radius, ink)];
}

function unpainted(): null {
  return null;
}

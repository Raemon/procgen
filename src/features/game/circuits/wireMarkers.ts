import type { Marker } from '@/features/asset-library/worlds/worldSampler';
import {
  DARK_WIRE_INK,
  LIT_WIRE_INK,
  WIRE_EAST,
  WIRE_NORTH,
  WIRE_SIDES,
  WIRE_SOUTH,
  WIRE_WEST,
  wireFaceArt,
} from '@/features/asset-library/tiles/art/fixtures/circuitWireArt';
import type { Cell } from '../worldRules';
import { cellKeyOf, cellWithin, type Circuit } from './circuit';

export const WIRE_LIES_FLAT = 0.05;
export const LIT_WIRE_GLOW = 0.9;

const DARK_WIRE_TAG = 'circuit line, dark: it will carry the power to its door once every goal on it is filled';
const LIT_WIRE_TAG = 'circuit line, lit: every goal on it is filled and the door it runs to stands open';

export function wireMarkersOf(
  circuits: readonly Circuit[],
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Marker[] {
  const markers: Marker[] = [];
  for (const circuit of circuits) {
    const joined = joinedCellsOf(circuit);
    for (const cell of circuit.wires) {
      if (cellWithin(cell, minX, minY, maxX, maxY)) markers.push(wireMarker(cell, wireMaskAt(cell, joined), circuit.powered));
    }
  }
  return markers;
}

export function joinedCellsOf(circuit: Circuit): Set<string> {
  return new Set([...circuit.wires, ...circuit.plates, ...circuit.doors].map(cellKeyOf));
}

export function wireMaskAt(cell: Cell, joined: ReadonlySet<string>): number {
  let mask = 0;
  for (const side of WIRE_SIDES) {
    if (joined.has(cellKeyOf({ x: cell.x + side.dx, y: cell.y + side.dy }))) mask |= side.bit;
  }
  return mask;
}

function wireMarker(cell: Cell, mask: number, lit: boolean): Marker {
  return {
    x: cell.x,
    y: cell.y,
    glyph: wireGlyph(mask, lit),
    color: lit ? LIT_WIRE_INK : DARK_WIRE_INK,
    tag: lit ? LIT_WIRE_TAG : DARK_WIRE_TAG,
    faceArt: wireFaceArt(mask, lit),
    standingHeight: WIRE_LIES_FLAT,
    seeThroughUnpaintedArt: true,
    glow: lit ? LIT_WIRE_GLOW : 0,
  };
}

function wireGlyph(mask: number, lit: boolean): string {
  const runsAcross = (mask & (WIRE_EAST | WIRE_WEST)) !== 0;
  const runsAlong = (mask & (WIRE_NORTH | WIRE_SOUTH)) !== 0;
  if (runsAcross && runsAlong) return lit ? '╬' : '┼';
  if (runsAcross) return lit ? '═' : '─';
  return lit ? '║' : '│';
}

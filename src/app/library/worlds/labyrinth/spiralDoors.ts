import { chunkAtPerimeter, perimeterCount, perimeterIndexOf, ringOf, type ChunkCoord } from './chunkRing';
import { hashUnit } from './hashUnit';
import type { LabyrinthKnobs } from './labyrinthKnobs';

export const GOLDEN_ANGLE = 2.399963229728653;

const TAU = 2 * Math.PI;

function hash01(knobs: LabyrinthKnobs, label: string): number {
  return hashUnit(`${knobs.seed}:spiral:${label}`);
}

export function outwardDoorAngle(ring: number, knobs: LabyrinthKnobs): number {
  const theta0 = hash01(knobs, 'theta0') * TAU;
  const jitter = (hash01(knobs, `jitter:${ring}`) - 0.5) * knobs.doorJitter * (TAU / 8);
  return theta0 + ring * GOLDEN_ANGLE + jitter;
}

function awayFromCorners(index: number, ring: number): number {
  const count = perimeterCount(ring);
  const wrapped = ((Math.round(index) % count) + count) % count;
  return wrapped % (2 * ring) === ring ? (wrapped + 1) % count : wrapped;
}

const DOOR_CLUSTER_SHARE = 0.25;
const CHUNKS_PER_EXTRA_DOOR = 3;

export function doorsOutOfRing(ring: number): number {
  return 1 + Math.floor(ring / CHUNKS_PER_EXTRA_DOOR);
}

export function radialDoorIndices(ring: number, knobs: LabyrinthKnobs): number[] {
  const outer = ring + 1;
  const count = perimeterCount(outer);
  const first = (outwardDoorAngle(ring, knobs) / TAU) * count;
  const window = Math.max(1, Math.floor(count * DOOR_CLUSTER_SHARE));
  const wanted = Math.min(doorsOutOfRing(ring), window);
  return spreadThroughTheWindow(first, window, wanted, outer);
}

function spreadThroughTheWindow(
  first: number,
  window: number,
  wanted: number,
  outer: number,
): number[] {
  const indices = new Set<number>();
  for (let step = 0; step < wanted; step++) {
    indices.add(awayFromCorners(first + (step * window) / wanted, outer));
  }
  return [...indices];
}

function inwardOf(chunk: ChunkCoord): ChunkCoord {
  const ring = ringOf(chunk.x, chunk.y);
  if (Math.abs(chunk.x) === ring && Math.abs(chunk.y) < ring) {
    return { x: chunk.x - Math.sign(chunk.x), y: chunk.y };
  }
  return { x: chunk.x, y: chunk.y - Math.sign(chunk.y) };
}

export function ringBreakIndex(ring: number, knobs: LabyrinthKnobs): number {
  const count = perimeterCount(ring);
  const outerDoor = chunkAtPerimeter(ring + 1, radialDoorIndices(ring, knobs)[0]!);
  const doorIndex = perimeterIndexOf(inwardOf(outerDoor).x, inwardOf(outerDoor).y);
  const gap = 2 + Math.floor(hash01(knobs, `break:${ring}`) * 3);
  return ((doorIndex - gap) % count + count) % count;
}

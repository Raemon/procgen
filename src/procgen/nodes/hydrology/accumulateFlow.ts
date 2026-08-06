import type { FieldWindow } from '../../values/fieldWindow';
import { indicesByDescendingHeight } from './heightOrder';

const NEIGHBOR_STEPS: readonly (readonly [number, number, number])[] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT1_2],
  [1, -1, Math.SQRT1_2],
  [-1, 1, Math.SQRT1_2],
  [-1, -1, Math.SQRT1_2],
];

export function accumulatedFlow(
  surface: Float32Array,
  window: FieldWindow,
  seaLevel: number,
): Float32Array {
  const flow = new Float32Array(surface.length).fill(1);
  const order = indicesByDescendingHeight(surface);
  for (let step = 0; step < order.length; step++) {
    const index = order[step]!;
    if (surface[index]! <= seaLevel) continue;
    const downhill = steepestDownhillNeighbor(surface, window, index);
    if (downhill >= 0) flow[downhill] = flow[downhill]! + flow[index]!;
  }
  return flow;
}

function steepestDownhillNeighbor(surface: Float32Array, window: FieldWindow, index: number): number {
  const x = index % window.width;
  const y = (index - x) / window.width;
  let best = -1;
  let bestDrop = 0;
  for (const [dx, dy, inverseDistance] of NEIGHBOR_STEPS) {
    const neighbor = neighborIndex(window, x + dx, y + dy);
    if (neighbor < 0) continue;
    const drop = (surface[index]! - surface[neighbor]!) * inverseDistance;
    if (drop > bestDrop) {
      best = neighbor;
      bestDrop = drop;
    }
  }
  return best;
}

function neighborIndex(window: FieldWindow, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= window.width || y >= window.height) return -1;
  return y * window.width + x;
}

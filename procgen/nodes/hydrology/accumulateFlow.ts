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

export interface FlowRouting {
  seaLevel: number;
  convergence: number;
  channelizeAbove: number;
}

export function accumulatedFlow(
  surface: Float32Array,
  window: FieldWindow,
  routing: FlowRouting,
): Float32Array {
  const flow = new Float32Array(surface.length).fill(1);
  const order = indicesByDescendingHeight(surface);
  const shares = new Float64Array(NEIGHBOR_STEPS.length);
  for (let step = 0; step < order.length; step++) {
    const index = order[step]!;
    if (surface[index]! <= routing.seaLevel) continue;
    spreadDownhill(surface, window, flow, shares, index, routing);
  }
  return flow;
}

function spreadDownhill(
  surface: Float32Array,
  window: FieldWindow,
  flow: Float32Array,
  shares: Float64Array,
  index: number,
  routing: FlowRouting,
): void {
  const x = index % window.width;
  const y = (index - x) / window.width;
  const carried = flow[index]!;
  const spreading = carried < routing.channelizeAbove;
  const total = weighDownhillNeighbors(surface, window, shares, x, y, index, routing, spreading);
  if (total <= 0) return;
  for (let step = 0; step < NEIGHBOR_STEPS.length; step++) {
    if (shares[step] === 0) continue;
    const [dx, dy] = NEIGHBOR_STEPS[step]!;
    const neighbor = neighborIndex(window, x + dx, y + dy);
    flow[neighbor] = flow[neighbor]! + (carried * shares[step]!) / total;
  }
}

function weighDownhillNeighbors(
  surface: Float32Array,
  window: FieldWindow,
  shares: Float64Array,
  x: number,
  y: number,
  index: number,
  routing: FlowRouting,
  spreading: boolean,
): number {
  let steepest = 0;
  let steepestStep = -1;
  let total = 0;
  for (let step = 0; step < NEIGHBOR_STEPS.length; step++) {
    const [dx, dy, inverseDistance] = NEIGHBOR_STEPS[step]!;
    const neighbor = neighborIndex(window, x + dx, y + dy);
    const gradient = neighbor < 0 ? 0 : (surface[index]! - surface[neighbor]!) * inverseDistance;
    shares[step] = gradient > 0 && spreading ? raised(gradient, routing.convergence) : 0;
    total += shares[step]!;
    if (gradient > steepest) {
      steepest = gradient;
      steepestStep = step;
    }
  }
  if (spreading || steepestStep < 0) return total;
  shares[steepestStep] = 1;
  return 1;
}

function raised(gradient: number, exponent: number): number {
  if (!Number.isInteger(exponent)) return Math.pow(gradient, exponent);
  let raisedGradient = 1;
  for (let power = 0; power < exponent; power++) raisedGradient *= gradient;
  return raisedGradient;
}

function neighborIndex(window: FieldWindow, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= window.width || y >= window.height) return -1;
  return y * window.width + x;
}

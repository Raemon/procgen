import type { FieldWindow } from '../../values/fieldWindow';
import { MinHeap } from './minHeap';

export interface DrainSpec {
  seaLevel: number;
  maxFill: number;
}

const SPILL_STEP = 1e-5;

export function drainableSurface(window: FieldWindow, spec: DrainSpec): Float32Array {
  const filled = new Float32Array(window.data.length).fill(Infinity);
  const heap = new MinHeap();
  seedOutlets(window, spec, filled, heap);
  while (heap.size > 0) raiseNeighborsOf(window, spec, filled, heap, heap.pop());
  return filled;
}

function seedOutlets(window: FieldWindow, spec: DrainSpec, filled: Float32Array, heap: MinHeap): void {
  for (let index = 0; index < window.data.length; index++) {
    if (!isOutlet(window, spec, index)) continue;
    filled[index] = window.data[index]!;
    heap.push(filled[index]!, index);
  }
}

function isOutlet(window: FieldWindow, spec: DrainSpec, index: number): boolean {
  return window.data[index]! <= spec.seaLevel || isOnWindowEdge(window, index);
}

function isOnWindowEdge(window: FieldWindow, index: number): boolean {
  const x = index % window.width;
  const y = (index - x) / window.width;
  return x === 0 || y === 0 || x === window.width - 1 || y === window.height - 1;
}

function raiseNeighborsOf(
  window: FieldWindow,
  spec: DrainSpec,
  filled: Float32Array,
  heap: MinHeap,
  index: number,
): void {
  const x = index % window.width;
  const y = (index - x) / window.width;
  if (x > 0) raiseOne(window, spec, filled, heap, index, index - 1);
  if (x < window.width - 1) raiseOne(window, spec, filled, heap, index, index + 1);
  if (y > 0) raiseOne(window, spec, filled, heap, index, index - window.width);
  if (y < window.height - 1) raiseOne(window, spec, filled, heap, index, index + window.width);
}

function raiseOne(
  window: FieldWindow,
  spec: DrainSpec,
  filled: Float32Array,
  heap: MinHeap,
  from: number,
  neighbor: number,
): void {
  if (filled[neighbor]! !== Infinity) return;
  filled[neighbor] = spilledLevel(window.data[neighbor]!, filled[from]!, spec.maxFill);
  heap.push(filled[neighbor]!, neighbor);
}

function spilledLevel(groundLevel: number, spillFrom: number, maxFill: number): number {
  return Math.min(Math.max(groundLevel, spillFrom + SPILL_STEP), groundLevel + maxFill);
}

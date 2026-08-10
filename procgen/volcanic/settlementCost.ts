import { MinHeap } from '../nodes/hydrology/minHeap';

export interface CostGrid {
  originX: number;
  originY: number;
  side: number;
  step: number;
  costAt: (worldX: number, worldY: number) => number;
}

export interface CostSource {
  x: number;
  y: number;
  cost: number;
}

export function cheapestCostReaching(grid: CostGrid, sources: readonly CostSource[]): Float64Array {
  const reached = new Float64Array(grid.side * grid.side).fill(Infinity);
  const heap = new MinHeap();
  seedSources(grid, sources, reached, heap);
  while (heap.size > 0) relaxNeighborsOf(grid, reached, heap, heap.pop());
  return reached;
}

export function gridIndexOf(grid: CostGrid, worldX: number, worldY: number): number | null {
  const cellX = Math.round((worldX - grid.originX) / grid.step);
  const cellY = Math.round((worldY - grid.originY) / grid.step);
  if (cellX < 0 || cellY < 0 || cellX >= grid.side || cellY >= grid.side) return null;
  return cellY * grid.side + cellX;
}

function seedSources(
  grid: CostGrid,
  sources: readonly CostSource[],
  reached: Float64Array,
  heap: MinHeap,
): void {
  for (const source of sources) {
    const index = gridIndexOf(grid, source.x, source.y);
    if (index === null || source.cost >= reached[index]!) continue;
    reached[index] = source.cost;
    heap.push(source.cost, index);
  }
}

function relaxNeighborsOf(
  grid: CostGrid,
  reached: Float64Array,
  heap: MinHeap,
  index: number,
): void {
  const cellX = index % grid.side;
  const cellY = (index - cellX) / grid.side;
  if (cellX > 0) relaxOne(grid, reached, heap, index, index - 1);
  if (cellX < grid.side - 1) relaxOne(grid, reached, heap, index, index + 1);
  if (cellY > 0) relaxOne(grid, reached, heap, index, index - grid.side);
  if (cellY < grid.side - 1) relaxOne(grid, reached, heap, index, index + grid.side);
}

function relaxOne(
  grid: CostGrid,
  reached: Float64Array,
  heap: MinHeap,
  from: number,
  neighbor: number,
): void {
  const stepCost = costOfEntering(grid, neighbor);
  const through = reached[from]! + stepCost;
  if (through >= reached[neighbor]!) return;
  reached[neighbor] = through;
  heap.push(through, neighbor);
}

function costOfEntering(grid: CostGrid, index: number): number {
  const cellX = index % grid.side;
  const cellY = (index - cellX) / grid.side;
  return grid.costAt(grid.originX + cellX * grid.step, grid.originY + cellY * grid.step);
}

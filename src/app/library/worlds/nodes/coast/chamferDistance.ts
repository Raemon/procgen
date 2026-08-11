const ORTHOGONAL_COST = 3;
const DIAGONAL_COST = 4;
const COST_PER_TILE = 3;

export function chamferDistanceFromSeeds(
  isSeed: Uint8Array,
  width: number,
  height: number,
): Float32Array {
  const cost = new Float32Array(isSeed.length);
  for (let i = 0; i < cost.length; i++) cost[i] = isSeed[i] === 1 ? 0 : Infinity;
  sweepForward(cost, width, height);
  sweepBackward(cost, width, height);
  for (let i = 0; i < cost.length; i++) cost[i] = cost[i]! / COST_PER_TILE;
  return cost;
}

function sweepForward(cost: Float32Array, width: number, height: number): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) relaxAgainst(cost, width, height, x, y, FORWARD_STEPS);
  }
}

function sweepBackward(cost: Float32Array, width: number, height: number): void {
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) relaxAgainst(cost, width, height, x, y, BACKWARD_STEPS);
  }
}

function relaxAgainst(
  cost: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  steps: readonly (readonly [number, number, number])[],
): void {
  const index = y * width + x;
  for (const [dx, dy, stepCost] of steps) {
    const neighborX = x + dx;
    const neighborY = y + dy;
    if (neighborX < 0 || neighborY < 0 || neighborX >= width || neighborY >= height) continue;
    cost[index] = Math.min(cost[index]!, cost[neighborY * width + neighborX]! + stepCost);
  }
}

const FORWARD_STEPS = [
  [-1, 0, ORTHOGONAL_COST],
  [0, -1, ORTHOGONAL_COST],
  [-1, -1, DIAGONAL_COST],
  [1, -1, DIAGONAL_COST],
] as const;

const BACKWARD_STEPS = [
  [1, 0, ORTHOGONAL_COST],
  [0, 1, ORTHOGONAL_COST],
  [1, 1, DIAGONAL_COST],
  [-1, 1, DIAGONAL_COST],
] as const;

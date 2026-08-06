import type { ClusterShape } from './latentTypes';

export function clusterShapes(assignment: Int32Array, cellsPerSide: number, clusterCount: number): ClusterShape[] {
  const cellCount = assignment.length;
  const counts = countMembers(assignment, clusterCount);
  const edges = countEdgeCells(assignment, cellsPerSide, clusterCount);
  const touches = countTouches(assignment, cellsPerSide, clusterCount);
  const largest = largestComponentSizes(assignment, cellsPerSide, clusterCount);
  return Array.from({ length: clusterCount }, (_, k) => ({
    share: counts[k]! / cellCount,
    contiguity: counts[k]! > 0 ? largest[k]! / counts[k]! : 0,
    edgeRatio: counts[k]! > 0 ? edges[k]! / counts[k]! : 0,
    touchCounts: touches[k]!,
  }));
}

function countMembers(assignment: Int32Array, clusterCount: number): Float64Array {
  const counts = new Float64Array(clusterCount);
  for (let cell = 0; cell < assignment.length; cell++) counts[assignment[cell]!]!++;
  return counts;
}

function countEdgeCells(assignment: Int32Array, cellsPerSide: number, clusterCount: number): Float64Array {
  const edges = new Float64Array(clusterCount);
  for (let cell = 0; cell < assignment.length; cell++) {
    if (hasForeignNeighbor(assignment, cellsPerSide, cell)) edges[assignment[cell]!]!++;
  }
  return edges;
}

function countTouches(assignment: Int32Array, cellsPerSide: number, clusterCount: number): number[][] {
  const touches = Array.from({ length: clusterCount }, () => new Array<number>(clusterCount).fill(0));
  for (let cell = 0; cell < assignment.length; cell++) {
    for (const neighbor of neighborsOf(assignment, cellsPerSide, cell)) {
      if (neighbor !== assignment[cell]!) {
        const row = touches[assignment[cell]!]!;
        row[neighbor] = row[neighbor]! + 1;
      }
    }
  }
  return touches;
}

function hasForeignNeighbor(assignment: Int32Array, cellsPerSide: number, cell: number): boolean {
  return neighborsOf(assignment, cellsPerSide, cell).some((neighbor) => neighbor !== assignment[cell]!);
}

function neighborsOf(assignment: Int32Array, cellsPerSide: number, cell: number): number[] {
  const x = cell % cellsPerSide;
  const y = Math.floor(cell / cellsPerSide);
  const neighbors: number[] = [];
  if (x > 0) neighbors.push(assignment[cell - 1]!);
  if (x < cellsPerSide - 1) neighbors.push(assignment[cell + 1]!);
  if (y > 0) neighbors.push(assignment[cell - cellsPerSide]!);
  if (y < cellsPerSide - 1) neighbors.push(assignment[cell + cellsPerSide]!);
  return neighbors;
}

function largestComponentSizes(assignment: Int32Array, cellsPerSide: number, clusterCount: number): Float64Array {
  const largest = new Float64Array(clusterCount);
  const visited = new Uint8Array(assignment.length);
  for (let cell = 0; cell < assignment.length; cell++) {
    if (visited[cell]) continue;
    const size = floodComponent(assignment, visited, cellsPerSide, cell);
    const k = assignment[cell]!;
    if (size > largest[k]!) largest[k] = size;
  }
  return largest;
}

function floodComponent(
  assignment: Int32Array,
  visited: Uint8Array,
  cellsPerSide: number,
  start: number,
): number {
  const cluster = assignment[start]!;
  const stack = [start];
  visited[start] = 1;
  let size = 0;
  while (stack.length > 0) {
    const cell = stack.pop()!;
    size++;
    pushUnvisitedSameClusterNeighbors(assignment, visited, cellsPerSide, cell, cluster, stack);
  }
  return size;
}

function pushUnvisitedSameClusterNeighbors(
  assignment: Int32Array,
  visited: Uint8Array,
  cellsPerSide: number,
  cell: number,
  cluster: number,
  stack: number[],
): void {
  const x = cell % cellsPerSide;
  const y = Math.floor(cell / cellsPerSide);
  const candidates = [
    x > 0 ? cell - 1 : -1,
    x < cellsPerSide - 1 ? cell + 1 : -1,
    y > 0 ? cell - cellsPerSide : -1,
    y < cellsPerSide - 1 ? cell + cellsPerSide : -1,
  ];
  for (const candidate of candidates) {
    if (candidate >= 0 && !visited[candidate] && assignment[candidate] === cluster) {
      visited[candidate] = 1;
      stack.push(candidate);
    }
  }
}

import type { RandomStream } from '../../../random/mulberry32';

export interface EdgeDoors {
  westRows: number[];
  northCols: number[];
}

export function pickEdgeDoors(
  cells: number,
  doorsPerEdge: number,
  westRng: RandomStream,
  northRng: RandomStream,
): EdgeDoors {
  return {
    westRows: pickDistinctCells(cells, doorsPerEdge, westRng),
    northCols: pickDistinctCells(cells, doorsPerEdge, northRng),
  };
}

function pickDistinctCells(cells: number, count: number, rng: RandomStream): number[] {
  const order = shuffledRange(cells, rng);
  return order.slice(0, Math.min(count, cells));
}

function shuffledRange(length: number, rng: RandomStream): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

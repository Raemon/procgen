import { cellHash01 } from './synthSeeds';

export interface PlankCell {
  plankId: number;
  seamDistance: number;
  alongPlank: number;
}

export function plankAt(x: number, y: number, planks: number, seed: number): PlankCell {
  const row = Math.floor(y * planks);
  const buttShift = cellHash01(row, 0, seed);
  const alongPlank = (x + buttShift) % 1;
  const segment = Math.floor((x + buttShift) * 2);
  return {
    plankId: cellHash01(segment, row, seed + 7),
    seamDistance: seamDistanceOf(y * planks - row, alongPlank, planks),
    alongPlank,
  };
}

function seamDistanceOf(rowFrac: number, alongPlank: number, planks: number): number {
  const buttFrac = (alongPlank * 2) % 1;
  const rowEdge = Math.min(rowFrac, 1 - rowFrac) * planks;
  const buttEdge = Math.min(buttFrac, 1 - buttFrac) * planks * 2;
  return Math.min(rowEdge, buttEdge / 4);
}

import { averageInk } from './averageInk';

export function halvedSide(side: number): number {
  return Math.max(1, Math.floor(side / 2));
}

export function halveFacePixels(inks: readonly string[], side: number): string[] {
  const smallerSide = halvedSide(side);
  const halved: string[] = [];
  for (let y = 0; y < smallerSide; y++)
    for (let x = 0; x < smallerSide; x++)
      halved.push(averageInk(blockAt(inks, side, smallerSide, x, y)));
  return halved;
}

function blockAt(
  inks: readonly string[],
  side: number,
  smallerSide: number,
  x: number,
  y: number,
): string[] {
  const block: string[] = [];
  for (const sourceY of spanOf(y, side, smallerSide))
    for (const sourceX of spanOf(x, side, smallerSide)) block.push(inks[sourceY * side + sourceX]!);
  return block;
}

function spanOf(target: number, side: number, smallerSide: number): number[] {
  const from = Math.floor((target * side) / smallerSide);
  const to = Math.max(from + 1, Math.floor(((target + 1) * side) / smallerSide));
  return Array.from({ length: to - from }, (_, step) => from + step);
}

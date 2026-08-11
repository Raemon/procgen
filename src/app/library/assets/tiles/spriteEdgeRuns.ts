import { spriteGridSize, type SpriteArt } from './spriteArt';

export type SpriteEdgeSide = 'left' | 'right' | 'top' | 'bottom';

export interface SpriteEdgeRun {
  side: SpriteEdgeSide;
  col: number;
  row: number;
  cells: number;
  ink: string;
}

const SIDES: readonly SpriteEdgeSide[] = ['left', 'right', 'top', 'bottom'];

const OUTWARD: Record<SpriteEdgeSide, readonly [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  top: [0, -1],
  bottom: [0, 1],
};

export function spriteEdgeRuns(sprite: SpriteArt): SpriteEdgeRun[] {
  const size = spriteGridSize(sprite);
  return SIDES.flatMap((side) => runsOfSide(sprite, size, side));
}

function runsOfSide(sprite: SpriteArt, size: number, side: SpriteEdgeSide): SpriteEdgeRun[] {
  const runs: SpriteEdgeRun[] = [];
  for (let lane = 0; lane < size; lane++) collectLane(sprite, size, side, lane, runs);
  return runs;
}

function collectLane(
  sprite: SpriteArt,
  size: number,
  side: SpriteEdgeSide,
  lane: number,
  runs: SpriteEdgeRun[],
): void {
  let open: SpriteEdgeRun | null = null;
  for (let step = 0; step < size; step++) {
    const { col, row } = laneCell(side, lane, step);
    const ink = exposedInk(sprite, size, col, row, side);
    if (open && ink === open.ink) open.cells++;
    else open = ink === null ? null : openRun(runs, side, col, row, ink);
  }
}

function laneCell(side: SpriteEdgeSide, lane: number, step: number): { col: number; row: number } {
  return runsDownColumns(side) ? { col: lane, row: step } : { col: step, row: lane };
}

function runsDownColumns(side: SpriteEdgeSide): boolean {
  return side === 'left' || side === 'right';
}

function openRun(
  runs: SpriteEdgeRun[],
  side: SpriteEdgeSide,
  col: number,
  row: number,
  ink: string,
): SpriteEdgeRun {
  const run: SpriteEdgeRun = { side, col, row, cells: 1, ink };
  runs.push(run);
  return run;
}

function exposedInk(
  sprite: SpriteArt,
  size: number,
  col: number,
  row: number,
  side: SpriteEdgeSide,
): string | null {
  const ink = inkAt(sprite, size, col, row);
  if (ink === null) return null;
  const [outCol, outRow] = OUTWARD[side];
  return inkAt(sprite, size, col + outCol, row + outRow) === null ? ink : null;
}

function inkAt(sprite: SpriteArt, size: number, col: number, row: number): string | null {
  if (col < 0 || row < 0 || col >= size || row >= size) return null;
  return sprite[row * size + col] ?? null;
}

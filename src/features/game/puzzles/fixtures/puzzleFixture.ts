export type PuzzleFixtureKind = 'lever' | 'key' | 'plate' | 'crate' | 'pillar' | 'gate';

export interface PuzzleFixture {
  id: string;
  kind: PuzzleFixtureKind;
  x: number;
  y: number;
}

export function fixture(
  id: string,
  kind: PuzzleFixtureKind,
  cell: { x: number; y: number },
): PuzzleFixture {
  return { id, kind, x: cell.x, y: cell.y };
}

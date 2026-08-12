import { cellFromKey } from '../cellGrid';
import type { TileCharacterOf } from '../tileCharacter';
import type { TileIdProbe } from '../worldProbes';
import { entropyBitsOverCells } from './sceneryShares';
import { meanOf } from './meanOf';

export const REGION_SPAN = 16;
const SMALLEST_TELLING_REGION = 32;

export function meanRegionEntropyBits(
  seen: ReadonlySet<string>,
  tileIdAt: TileIdProbe,
  characterOf: TileCharacterOf,
): number {
  const regions = [...cellsByRegion(seen).values()].filter(
    (cells) => cells.length >= SMALLEST_TELLING_REGION,
  );
  return meanOf(regions.map((cells) => entropyBitsOverCells(cells, tileIdAt, characterOf)));
}

export function cellsByRegion(seen: ReadonlySet<string>): Map<string, string[]> {
  const regions = new Map<string, string[]>();
  for (const key of seen) {
    const region = regionKeyOf(key);
    const cells = regions.get(region) ?? [];
    cells.push(key);
    regions.set(region, cells);
  }
  return regions;
}

function regionKeyOf(key: string): string {
  const cell = cellFromKey(key);
  return `${Math.floor(cell.x / REGION_SPAN)},${Math.floor(cell.y / REGION_SPAN)}`;
}

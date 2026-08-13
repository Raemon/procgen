import { deflateRawSync } from 'node:zlib';
import type { CellCharacterProbe } from '../cellCharacter';
import { cellFromKey } from '../cellGrid';
import { sharesOfCounts, type ShareTally } from './sceneryShares';

const PLACE_SPAN = 8;
const SHARE_STEPS = 3;
const NOWHERE = 0;
const PLACES_FOR_FULL_CONFIDENCE = 30;

export function placeGrammarBitsPerPlace(
  seen: ReadonlySet<string>,
  characterAt: CellCharacterProbe,
): number {
  const places = mixtureSymbolPerPlace(seen, characterAt);
  if (places.size === 0) return 0;
  const grid = smoothedPlaceMap(placeMapBuffer(places));
  const bits = 8 * (deflatedBytes(grid.tokens) - deflatedBytes(blobShapedBaseline(grid.tokens)));
  return (Math.max(0, bits) / places.size) * smallSurveyDiscount(places.size);
}

function smallSurveyDiscount(placeCount: number): number {
  return Math.min(1, placeCount / PLACES_FOR_FULL_CONFIDENCE);
}

function deflatedBytes(buffer: Uint8Array): number {
  return deflateRawSync(buffer, { level: 9 }).length;
}

function blobShapedBaseline(tokens: Uint8Array): Uint8Array {
  return tokens.map((token) => (token === NOWHERE ? NOWHERE : 1));
}

function mixtureSymbolPerPlace(
  seen: ReadonlySet<string>,
  characterAt: CellCharacterProbe,
): Map<string, string> {
  const tallies = new Map<string, ShareTally>();
  for (const key of seen) {
    const cell = cellFromKey(key);
    tallyPlace(tallies, placeKeyOf(cell.x, cell.y), characterAt(cell.x, cell.y));
  }
  return new Map([...tallies.entries()].map(([place, counts]) => [place, mixtureSymbolOf(counts)]));
}

function tallyPlace(tallies: Map<string, ShareTally>, place: string, character: string): void {
  const counts = tallies.get(place) ?? new Map<string, number>();
  counts.set(character, (counts.get(character) ?? 0) + 1);
  tallies.set(place, counts);
}

function mixtureSymbolOf(counts: ShareTally): string {
  return [...sharesOfCounts(counts).entries()]
    .map(([character, share]) => [character, Math.floor(share * SHARE_STEPS)] as const)
    .filter(([, step]) => step > 0)
    .sort(([one], [other]) => one.localeCompare(other))
    .map(([character, step]) => `${character}~${step}`)
    .join(',');
}

function placeKeyOf(x: number, y: number): string {
  return `${Math.floor(x / PLACE_SPAN)},${Math.floor(y / PLACE_SPAN)}`;
}

interface PlaceMap {
  tokens: Uint8Array;
  rowSpan: number;
}

function placeMapBuffer(places: ReadonlyMap<string, string>): PlaceMap {
  const tokens = tokensBySymbol(places);
  const box = boundingBoxOf(places);
  const rowSpan = box.maxX - box.minX + 1;
  const grid = new Uint8Array(rowSpan * (box.maxY - box.minY + 1)).fill(NOWHERE);
  for (const [place, symbol] of places) {
    const cell = cellFromKey(place);
    grid[(cell.y - box.minY) * rowSpan + (cell.x - box.minX)] = tokens.get(symbol)!;
  }
  return { tokens: grid, rowSpan };
}

function smoothedPlaceMap(map: PlaceMap): PlaceMap {
  const smoothed = map.tokens.map((token, at) =>
    token === NOWHERE ? NOWHERE : modalNeighbourToken(map, at),
  );
  return { tokens: smoothed, rowSpan: map.rowSpan };
}

function modalNeighbourToken(map: PlaceMap, at: number): number {
  const counts = new Map<number, number>();
  for (const neighbour of neighbourhoodTokens(map, at)) {
    counts.set(neighbour, (counts.get(neighbour) ?? 0) + 1);
  }
  return modalTokenOf(counts, map.tokens[at]!);
}

function neighbourhoodTokens(map: PlaceMap, at: number): number[] {
  const x = at % map.rowSpan;
  const y = Math.floor(at / map.rowSpan);
  const tokens: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      collectToken(map, x + dx, y + dy, tokens);
    }
  }
  return tokens;
}

function collectToken(map: PlaceMap, x: number, y: number, tokens: number[]): void {
  if (x < 0 || x >= map.rowSpan) return;
  const at = y * map.rowSpan + x;
  const token = map.tokens[at];
  if (token !== undefined && token !== NOWHERE) tokens.push(token);
}

function modalTokenOf(counts: ReadonlyMap<number, number>, own: number): number {
  let winner = own;
  let winningCount = counts.get(own) ?? 0;
  for (const [token, count] of counts) {
    if (count > winningCount) {
      winner = token;
      winningCount = count;
    }
  }
  return winner;
}

function tokensBySymbol(places: ReadonlyMap<string, string>): Map<string, number> {
  const symbols = [...new Set(places.values())].sort();
  return new Map(symbols.map((symbol, index) => [symbol, (index % 255) + 1]));
}

function boundingBoxOf(places: ReadonlyMap<string, string>) {
  const cells = [...places.keys()].map(cellFromKey);
  return {
    minX: Math.min(...cells.map((cell) => cell.x)),
    maxX: Math.max(...cells.map((cell) => cell.x)),
    minY: Math.min(...cells.map((cell) => cell.y)),
    maxY: Math.max(...cells.map((cell) => cell.y)),
  };
}

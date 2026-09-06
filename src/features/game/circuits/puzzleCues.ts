import type { Cell } from '../worldRules';
import { cellKeyOf, cellWithin, type Circuit, type CircuitDoor, type CircuitPlate } from './circuit';

export type PuzzleCue = 'crate-pushed' | 'plate-lit' | 'door-opened' | 'circuit-powered';

export type PuzzleCueListener = (cells: Cell[]) => void;

export interface PuzzleSource {
  circuitsIn(minX: number, minY: number, maxX: number, maxY: number): Circuit[];
  cratesIn(minX: number, minY: number, maxX: number, maxY: number): Cell[];
}

export const CUE_EARSHOT_TILES = 20;

interface Glance {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  crates: Map<string, Cell>;
  circuits: Map<string, Circuit>;
}

export class PuzzleCues {
  private readonly listeners = new Map<PuzzleCue, Set<PuzzleCueListener>>();
  private seen: Glance | null = null;

  constructor(private readonly source: PuzzleSource) {}

  on(cue: PuzzleCue, listener: PuzzleCueListener): () => void {
    const existing = this.listeners.get(cue) ?? new Set<PuzzleCueListener>();
    existing.add(listener);
    this.listeners.set(cue, existing);
    return () => existing.delete(listener);
  }

  forget(): void {
    this.seen = null;
  }

  sync(centre: Cell): void {
    const next = glanceAround(this.source, centre);
    if (this.seen) for (const [cue, cells] of cuesBetween(this.seen, next)) this.emit(cue, cells);
    this.seen = next;
  }

  private emit(cue: PuzzleCue, cells: Cell[]): void {
    if (cells.length === 0) return;
    for (const listener of this.listeners.get(cue) ?? []) listener(cells);
  }
}

function glanceAround(source: PuzzleSource, centre: Cell): Glance {
  const minX = centre.x - CUE_EARSHOT_TILES;
  const minY = centre.y - CUE_EARSHOT_TILES;
  const maxX = centre.x + CUE_EARSHOT_TILES;
  const maxY = centre.y + CUE_EARSHOT_TILES;
  return {
    minX,
    minY,
    maxX,
    maxY,
    crates: new Map(source.cratesIn(minX, minY, maxX, maxY).map((cell) => [cellKeyOf(cell), cell])),
    circuits: new Map(source.circuitsIn(minX, minY, maxX, maxY).map((circuit) => [circuit.key, circuit])),
  };
}

function cuesBetween(before: Glance, after: Glance): Array<[PuzzleCue, Cell[]]> {
  const found: Array<[PuzzleCue, Cell[]]> = [];
  const pushed = pushedCrates(before, after);
  if (pushed.length > 0) found.push(['crate-pushed', pushed]);
  const lit: Cell[] = [];
  const opened: Cell[] = [];
  const powered: Cell[] = [];
  for (const [key, circuit] of after.circuits) {
    const earlier = before.circuits.get(key);
    if (!earlier) continue;
    lit.push(...newlyTrue(earlier.plates, circuit.plates, (plate) => plate.lit));
    opened.push(...newlyTrue(earlier.doors, circuit.doors, (door) => door.open));
    if (!earlier.powered && circuit.powered) powered.push(...circuit.doors);
  }
  if (lit.length > 0) found.push(['plate-lit', lit]);
  if (opened.length > 0) found.push(['door-opened', opened]);
  if (powered.length > 0) found.push(['circuit-powered', powered]);
  return found;
}

function pushedCrates(before: Glance, after: Glance): Cell[] {
  const bothSaw = (cell: Cell) =>
    cellWithin(
      cell,
      Math.max(before.minX, after.minX),
      Math.max(before.minY, after.minY),
      Math.min(before.maxX, after.maxX),
      Math.min(before.maxY, after.maxY),
    );
  const left = [...before.crates.values()].filter((cell) => bothSaw(cell) && !after.crates.has(cellKeyOf(cell)));
  const arrived = [...after.crates.values()].filter((cell) => bothSaw(cell) && !before.crates.has(cellKeyOf(cell)));
  return arrived.filter((cell) => left.some((from) => Math.abs(from.x - cell.x) + Math.abs(from.y - cell.y) === 1));
}

function newlyTrue<T extends CircuitPlate | CircuitDoor>(
  earlier: readonly T[],
  later: readonly T[],
  flag: (one: T) => boolean,
): Cell[] {
  const wasOn = new Set(earlier.filter(flag).map(cellKeyOf));
  const known = new Set(earlier.map(cellKeyOf));
  return later.filter((one) => flag(one) && known.has(cellKeyOf(one)) && !wasOn.has(cellKeyOf(one)));
}

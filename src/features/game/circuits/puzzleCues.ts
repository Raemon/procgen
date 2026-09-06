import { cellKeyOf, type Circuit, type CircuitDoor, type CircuitPlate, type WireCell } from './circuit';

export type PuzzleCue = 'crate-pushed' | 'plate-lit' | 'door-opened' | 'circuit-powered';

export type PuzzleCueListener = (cells: WireCell[]) => void;

export interface PuzzleSource {
  circuitsIn(minX: number, minY: number, maxX: number, maxY: number): Circuit[];
  cratesIn(minX: number, minY: number, maxX: number, maxY: number): WireCell[];
}

export const CUE_EARSHOT_TILES = 20;

interface Glance {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  crates: Map<string, WireCell>;
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

  sync(centre: WireCell): void {
    const next = glanceAround(this.source, centre);
    if (this.seen) for (const [cue, cells] of cuesBetween(this.seen, next)) this.emit(cue, cells);
    this.seen = next;
  }

  private emit(cue: PuzzleCue, cells: WireCell[]): void {
    if (cells.length === 0) return;
    for (const listener of this.listeners.get(cue) ?? []) listener(cells);
  }
}

function glanceAround(source: PuzzleSource, centre: WireCell): Glance {
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

export function cuesBetween(before: Glance, after: Glance): Array<[PuzzleCue, WireCell[]]> {
  const found: Array<[PuzzleCue, WireCell[]]> = [];
  const pushed = pushedCrates(before, after);
  if (pushed.length > 0) found.push(['crate-pushed', pushed]);
  const lit: WireCell[] = [];
  const opened: WireCell[] = [];
  const powered: WireCell[] = [];
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

function pushedCrates(before: Glance, after: Glance): WireCell[] {
  const bothSaw = (cell: WireCell) =>
    cell.x >= Math.max(before.minX, after.minX) &&
    cell.x <= Math.min(before.maxX, after.maxX) &&
    cell.y >= Math.max(before.minY, after.minY) &&
    cell.y <= Math.min(before.maxY, after.maxY);
  const left = [...before.crates.values()].filter((cell) => bothSaw(cell) && !after.crates.has(cellKeyOf(cell)));
  const arrived = [...after.crates.values()].filter((cell) => bothSaw(cell) && !before.crates.has(cellKeyOf(cell)));
  return left.length > 0 ? arrived : [];
}

function newlyTrue<T extends CircuitPlate | CircuitDoor>(
  earlier: readonly T[],
  later: readonly T[],
  flag: (one: T) => boolean,
): WireCell[] {
  const wasOn = new Set(earlier.filter(flag).map(cellKeyOf));
  const known = new Set(earlier.map(cellKeyOf));
  return later.filter((one) => flag(one) && known.has(cellKeyOf(one)) && !wasOn.has(cellKeyOf(one)));
}

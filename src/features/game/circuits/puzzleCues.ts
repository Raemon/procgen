import type { Cell } from '../worldRules';
import { cellKeyOf, cellWithin, type Circuit, type CircuitDoor, type CircuitPlate } from './circuit';

export interface CratePush {
  from: Cell;
  to: Cell;
}

export interface PuzzleCuePayloads {
  'crate-pushed': CratePush[];
  'plate-lit': Cell[];
  'door-opened': Cell[];
  'circuit-powered': Cell[];
}

export type PuzzleCue = keyof PuzzleCuePayloads;

export type PuzzleCueListener<C extends PuzzleCue> = (payload: PuzzleCuePayloads[C]) => void;

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

type FiredCue = { [C in PuzzleCue]: [C, PuzzleCuePayloads[C]] }[PuzzleCue];

export class PuzzleCues {
  private readonly listeners = new Map<PuzzleCue, Set<PuzzleCueListener<PuzzleCue>>>();
  private seen: Glance | null = null;

  constructor(private readonly source: PuzzleSource) {}

  on<C extends PuzzleCue>(cue: C, listener: PuzzleCueListener<C>): () => void {
    const existing = this.listeners.get(cue) ?? new Set<PuzzleCueListener<PuzzleCue>>();
    const heard = listener as PuzzleCueListener<PuzzleCue>;
    existing.add(heard);
    this.listeners.set(cue, existing);
    return () => existing.delete(heard);
  }

  forget(): void {
    this.seen = null;
  }

  sync(centre: Cell): void {
    const next = glanceAround(this.source, centre);
    if (this.seen) for (const [cue, payload] of cuesBetween(this.seen, next)) this.emit(cue, payload);
    this.seen = next;
  }

  private emit<C extends PuzzleCue>(cue: C, payload: PuzzleCuePayloads[C]): void {
    if (payload.length === 0) return;
    for (const listener of this.listeners.get(cue) ?? []) listener(payload);
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

function cuesBetween(before: Glance, after: Glance): FiredCue[] {
  const found: FiredCue[] = [];
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

function pushedCrates(before: Glance, after: Glance): CratePush[] {
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
  return arrived.flatMap((to) => {
    const from = left.find((cell) => Math.abs(cell.x - to.x) + Math.abs(cell.y - to.y) === 1);
    return from ? [{ from, to }] : [];
  });
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

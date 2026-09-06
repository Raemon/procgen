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

interface Earshot {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface Glance extends Earshot {
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
    for (const listener of this.listeners.get(cue) ?? []) listener(payload);
  }
}

interface CircuitBeforeAndAfter {
  earlier: Circuit;
  now: Circuit;
}

function glanceAround(source: PuzzleSource, centre: Cell): Glance {
  const earshot = earshotAround(centre);
  const { minX, minY, maxX, maxY } = earshot;
  return {
    ...earshot,
    crates: new Map(source.cratesIn(minX, minY, maxX, maxY).map((cell) => [cellKeyOf(cell), cell])),
    circuits: new Map(source.circuitsIn(minX, minY, maxX, maxY).map((circuit) => [circuit.key, circuit])),
  };
}

function earshotAround(centre: Cell): Earshot {
  return {
    minX: centre.x - CUE_EARSHOT_TILES,
    minY: centre.y - CUE_EARSHOT_TILES,
    maxX: centre.x + CUE_EARSHOT_TILES,
    maxY: centre.y + CUE_EARSHOT_TILES,
  };
}

function cuesBetween(before: Glance, after: Glance): FiredCue[] {
  const watched = circuitsWatchedThroughout(before, after);
  const fired: FiredCue[] = [
    ['crate-pushed', pushedCrates(before, after)],
    ['plate-lit', watched.flatMap((circuit) => newlyTrue(circuit.earlier.plates, circuit.now.plates, (plate) => plate.lit))],
    ['door-opened', watched.flatMap((circuit) => newlyTrue(circuit.earlier.doors, circuit.now.doors, (door) => door.open))],
    ['circuit-powered', watched.flatMap(doorsThatJustCameAlive)],
  ];
  return fired.filter(([, payload]) => payload.length > 0);
}

function circuitsWatchedThroughout(before: Glance, after: Glance): CircuitBeforeAndAfter[] {
  return [...after.circuits].flatMap(([key, now]) => {
    const earlier = before.circuits.get(key);
    return earlier ? [{ earlier, now }] : [];
  });
}

function doorsThatJustCameAlive({ earlier, now }: CircuitBeforeAndAfter): Cell[] {
  return !earlier.powered && now.powered ? [...now.doors] : [];
}

function pushedCrates(before: Glance, after: Glance): CratePush[] {
  const heardBoth = earshotSharedBy(before, after);
  const left = [...before.crates.values()].filter((cell) => within(cell, heardBoth) && !after.crates.has(cellKeyOf(cell)));
  const arrived = [...after.crates.values()].filter((cell) => within(cell, heardBoth) && !before.crates.has(cellKeyOf(cell)));
  return arrived.flatMap((to) => {
    const from = left.find((cell) => oneTileApart(cell, to));
    return from ? [{ from, to }] : [];
  });
}

function earshotSharedBy(before: Earshot, after: Earshot): Earshot {
  return {
    minX: Math.max(before.minX, after.minX),
    minY: Math.max(before.minY, after.minY),
    maxX: Math.min(before.maxX, after.maxX),
    maxY: Math.min(before.maxY, after.maxY),
  };
}

function within(cell: Cell, earshot: Earshot): boolean {
  return cellWithin(cell, earshot.minX, earshot.minY, earshot.maxX, earshot.maxY);
}

function oneTileApart(one: Cell, other: Cell): boolean {
  return Math.abs(one.x - other.x) + Math.abs(one.y - other.y) === 1;
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

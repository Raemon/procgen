import { cellKeyOf, type WireCell } from './circuit';

export type FloorProbe = (x: number, y: number) => boolean;

const HEADINGS: WireCell[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];
const NO_HEADING = HEADINGS.length;
const FRESH_CELL_COST = 2;
const TURN_COST = 1;

interface RouteState {
  x: number;
  y: number;
  heading: number;
}

export function routeWires(plates: readonly WireCell[], doors: readonly WireCell[], isFloor: FloorProbe): WireCell[] {
  const laid = new Map<string, WireCell>();
  const endpoints = new Set([...plates, ...doors].map(cellKeyOf));
  for (const door of doors) {
    for (const plate of plates) {
      for (const cell of cheapestPath(plate, door, isFloor, laid)) {
        if (!endpoints.has(cellKeyOf(cell))) laid.set(cellKeyOf(cell), cell);
      }
    }
  }
  return [...laid.values()];
}

function cheapestPath(
  from: WireCell,
  to: WireCell,
  isFloor: FloorProbe,
  laid: ReadonlyMap<string, WireCell>,
): WireCell[] {
  const costs = new Map<string, number>();
  const parents = new Map<string, RouteState | null>();
  const buckets: RouteState[][] = [];
  const start = { x: from.x, y: from.y, heading: NO_HEADING };
  costs.set(stateKey(start), 0);
  parents.set(stateKey(start), null);
  pushAt(buckets, 0, start);
  for (let cost = 0; cost < buckets.length; cost++) {
    for (let index = 0; index < (buckets[cost]?.length ?? 0); index++) {
      const state = buckets[cost]![index]!;
      if (costs.get(stateKey(state)) !== cost) continue;
      if (state.x === to.x && state.y === to.y) return pathBackFrom(state, parents);
      for (const next of stepsFrom(state, to, isFloor)) {
        const stepCost = cost + costOfStep(state, next, laid);
        const key = stateKey(next);
        if (stepCost >= (costs.get(key) ?? Infinity)) continue;
        costs.set(key, stepCost);
        parents.set(key, state);
        pushAt(buckets, stepCost, next);
      }
    }
  }
  return [];
}

function stepsFrom(state: RouteState, goal: WireCell, isFloor: FloorProbe): RouteState[] {
  return HEADINGS.map((delta, heading) => ({ x: state.x + delta.x, y: state.y + delta.y, heading })).filter(
    (next) => (next.x === goal.x && next.y === goal.y) || isFloor(next.x, next.y),
  );
}

function costOfStep(state: RouteState, next: RouteState, laid: ReadonlyMap<string, WireCell>): number {
  const ground = laid.has(cellKeyOf(next)) ? 0 : FRESH_CELL_COST;
  const turn = state.heading !== NO_HEADING && state.heading !== next.heading ? TURN_COST : 0;
  return ground + turn;
}

function pathBackFrom(end: RouteState, parents: ReadonlyMap<string, RouteState | null>): WireCell[] {
  const path: WireCell[] = [];
  for (let state: RouteState | null = end; state; state = parents.get(stateKey(state)) ?? null) {
    path.push({ x: state.x, y: state.y });
  }
  return path.reverse();
}

function pushAt(buckets: RouteState[][], cost: number, state: RouteState): void {
  while (buckets.length <= cost) buckets.push([]);
  buckets[cost]!.push(state);
}

function stateKey(state: RouteState): string {
  return `${state.x},${state.y},${state.heading}`;
}

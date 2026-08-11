import { fixture, type PuzzleFixture } from '../fixtures/puzzleFixture';
import {
  nothingToSolve,
  registerPuzzleKind,
  type FurnishContext,
  type FurnishedRoom,
} from './puzzleKind';
import {
  chanceToRuinTheRoom,
  ruinChanceWantedAt,
  timesTheSolutionChangesCrate,
} from './chanceToRuinTheRoom';
import {
  cratesStillOnPlates,
  everyDoorwayCanRunTheSolution,
  reversePullCrates,
  type PullableRoom,
} from './reversePullCrates';
import { cellKey } from './cellKey';
import { climbingCount, crowdingCount, fixtureCapacity } from './roomCapacity';
import { releaseWalkingRoom, scatterPillars } from './scatterPillars';
import { RoomCells, type Cell } from './roomCells';

const CRATE_SHARE = 6;
const PILLAR_SHARE = 1;
const MOST_PULLS_PER_CRATE = 6;
const MOST_PULLS_IN_A_SOLUTION = 24;
const CELLS_PER_CRATE = 8;
const LAYOUTS_WORTH_TRYING = 10;

registerPuzzleKind({
  name: 'sokoban',
  teachingOrder: 2,
  teaches: 'the room itself is the mechanism, and a wrong push can cost you the room',
  furnish: furnishSokobanRoom,
});

function furnishSokobanRoom(context: FurnishContext): FurnishedRoom {
  const budget = { left: LAYOUTS_WORTH_TRYING };
  for (const demand of demandsToTry(context)) {
    const chosen = theMostRuinableLayoutOnOffer(context, demand, budget);
    if (chosen) return chosen.room;
    if (budget.left <= 0) break;
  }
  return nothingToSolve();
}

interface LayoutBudget {
  left: number;
}

interface LayoutOnOffer {
  room: FurnishedRoom;
  ruinChance: number;
  crateHandovers: number;
}

function theMostRuinableLayoutOnOffer(
  context: FurnishContext,
  demand: CrateDemand,
  budget: LayoutBudget,
): LayoutOnOffer | null {
  const wanted = ruinChanceWantedAt(context.level);
  let best: LayoutOnOffer | null = null;
  while (budget.left > 0) {
    budget.left--;
    const candidate = layOutCratesAndPlates(freshCells(context), demand);
    if (candidate && (!best || askingMoreOfThePlayer(candidate, best))) best = candidate;
    if (best && best.ruinChance >= wanted) return best;
  }
  return best;
}

function askingMoreOfThePlayer(candidate: LayoutOnOffer, best: LayoutOnOffer): boolean {
  if (candidate.ruinChance !== best.ruinChance) return candidate.ruinChance > best.ruinChance;
  return candidate.crateHandovers > best.crateHandovers;
}

interface CrateDemand {
  crates: number;
  pillars: number;
}

function demandsToTry(context: FurnishContext): CrateDemand[] {
  const roomiest = roomForCrates(context);
  const wanted = Math.min(crateCount(context), roomiest);
  const demands: CrateDemand[] = [];
  for (let crates = wanted; crates >= 1; crates--) {
    for (let pillars = pillarCount(context); pillars >= 0; pillars = fewerPillars(pillars)) {
      demands.push({ crates, pillars });
      if (pillars === 0) break;
    }
  }
  return demands;
}

function fewerPillars(pillars: number): number {
  return Math.max(0, Math.floor(pillars / 2));
}

function roomForCrates(context: FurnishContext): number {
  return Math.max(1, Math.floor(context.cells.freeCells().length / CELLS_PER_CRATE));
}

function freshCells(context: FurnishContext): FurnishContext {
  return { ...context, cells: new RoomCells(context.cells.interior) };
}

function layOutCratesAndPlates(
  context: FurnishContext,
  demand: CrateDemand,
): LayoutOnOffer | null {
  const pillars = scatterPillars(context, demand.pillars);
  const plates = placePlates(context, demand.crates);
  releaseWalkingRoom(context);
  const room = crateRoomStartingSolved(context, pillars, plates);
  const plateCells = new Set(plates.map(cellKey));
  const solution = reversePullCrates(room, context.entrances, pullsToAskFor(context, plates), context.rng);
  if (cratesStillOnPlates(room, plateCells).length > 0) return null;
  if (solution.length === 0) return null;
  if (!everyDoorwayCanRunTheSolution(room, context.entrances, solution)) return null;
  return {
    room: {
      fixtures: [...pillars, ...plates, ...cratesAsFixtures(room)],
      opensWhen: plates.map((plate) => plate.id),
      solution,
    },
    ruinChance: chanceToRuinTheRoom(room, context.entrances[0]!, plates),
    crateHandovers: timesTheSolutionChangesCrate(solution),
  };
}

function placePlates(context: FurnishContext, wanted: number): PuzzleFixture[] {
  const plates: PuzzleFixture[] = [];
  for (let index = 0; index < wanted; index++) {
    const cell = context.cells.takeCentreThenSpread(context.rng, context.level === 0 && index === 0);
    if (cell) plates.push(fixture(`plate${index}`, 'plate', cell));
  }
  return plates;
}

function crateRoomStartingSolved(
  context: FurnishContext,
  pillars: PuzzleFixture[],
  plates: PuzzleFixture[],
): PullableRoom {
  const crates = new Map<string, Cell>(
    plates.map((plate, index) => [`crate${index}`, { x: plate.x, y: plate.y }]),
  );
  return {
    cells: context.cells,
    pillars: new Set(pillars.map(cellKey)),
    crates,
    player: context.entrances[0]!,
  };
}

function cratesAsFixtures(room: PullableRoom): PuzzleFixture[] {
  return [...room.crates].map(([id, cell]) => fixture(id, 'crate', cell));
}

function crateCount(context: FurnishContext): number {
  return climbingCount(context.level, 2, fixtureCapacity(context.cells) / CRATE_SHARE);
}

function pullsToAskFor(context: FurnishContext, plates: readonly PuzzleFixture[]): number {
  const perCrate = Math.min(1 + context.level, MOST_PULLS_PER_CRATE);
  return Math.min(perCrate * plates.length, MOST_PULLS_IN_A_SOLUTION);
}

function pillarCount(context: FurnishContext): number {
  return crowdingCount(context.level, 1, fixtureCapacity(context.cells) / PILLAR_SHARE);
}

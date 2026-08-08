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
import { releaseWalkingRoom, scatterPillars } from './scatterPillars';
import { RoomCells, type Cell } from './roomCells';

const MOST_CRATES = 3;
const MOST_PILLARS = 5;
const MOST_PULLS_PER_CRATE = 6;
const CELLS_PER_CRATE = 8;

registerPuzzleKind({
  name: 'sokoban',
  introducedAtRing: 3,
  teaches: 'the room itself is the mechanism, and a wrong push can cost you the room',
  furnish: furnishSokobanRoom,
});

const FURNISH_ATTEMPTS = 8;

function furnishSokobanRoom(context: FurnishContext): FurnishedRoom {
  for (const demand of demandsToTry(context)) {
    const chosen = theMostRuinableLayoutOnOffer(context, demand);
    if (chosen) return chosen.room;
  }
  return nothingToSolve();
}

interface LayoutOnOffer {
  room: FurnishedRoom;
  ruinChance: number;
  crateHandovers: number;
}

function theMostRuinableLayoutOnOffer(
  context: FurnishContext,
  demand: CrateDemand,
): LayoutOnOffer | null {
  const wanted = ruinChanceWantedAt(context.level);
  let best: LayoutOnOffer | null = null;
  for (let attempt = 0; attempt < FURNISH_ATTEMPTS; attempt++) {
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
  const demands: CrateDemand[] = [];
  for (let crates = Math.min(crateCount(context.level), roomiest); crates >= 1; crates--) {
    for (let pillars = pillarCount(context.level); pillars >= 0; pillars -= 2) {
      demands.push({ crates, pillars: Math.max(0, pillars) });
    }
    demands.push({ crates, pillars: 0 });
  }
  return demands;
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
  const plateCells = new Set(plates.map((plate) => `${plate.x},${plate.y}`));
  const solution = reversePullCrates(
    room,
    context.entrances,
    pullCount(context.level) * plates.length,
    context.rng,
  );
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
    pillars: new Set(pillars.map((pillar) => `${pillar.x},${pillar.y}`)),
    crates,
    player: context.entrances[0]!,
  };
}

function cratesAsFixtures(room: PullableRoom): PuzzleFixture[] {
  return [...room.crates].map(([id, cell]) => fixture(id, 'crate', cell));
}

function crateCount(level: number): number {
  return Math.min(1 + Math.floor(level / 2), MOST_CRATES);
}

function pullCount(level: number): number {
  return Math.min(1 + level, MOST_PULLS_PER_CRATE);
}

function pillarCount(level: number): number {
  return Math.max(0, Math.min(level - 1, MOST_PILLARS));
}

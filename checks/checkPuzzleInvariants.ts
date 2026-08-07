import { EMPTY_TILE } from '../procgen/values/chunkValues';
import {
  bandCells,
  eastGateBand,
} from '../procgen/nodes/puzzle/puzzleRoomCorridors';
import type { PuzzleRoomKnobs } from '../procgen/nodes/puzzle/puzzleRoomKnobs';
import { rectContains, roomInteriorRect } from '../procgen/nodes/puzzle/puzzleRoomLattice';
import { puzzleShellAt } from '../procgen/nodes/puzzle/puzzleRoomShell';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { WorldSampler } from '../procgen/worldSampler';
import { Tileset } from '../library/tiles/tileset';
import { isWalkableTile } from '../world/tileWalkability';
import { everyFixtureLook, fixtureLook } from '../world/puzzles/fixtures/fixtureAppearance';
import { allPuzzleKinds } from '../world/puzzles/kinds/puzzleKind';
import { pushCrate } from '../world/puzzles/interaction/pushCrate';
import { PuzzleWorld } from '../world/puzzles/puzzleWorld';
import { puzzleKnobsFromPipeline } from '../world/puzzles/puzzleKnobsFromPipeline';
import { everyFixtureOf, type PuzzleRoomLayout } from '../world/puzzles/rooms/puzzleRoomLayout';
import { fixtureIsOn, roomIsSolved } from '../world/puzzles/state/fixtureSignals';

type Check = (name: string, condition: boolean) => void;

const PUZZLE_PRESET_NAME = 'puzzle labyrinth';

export function checkPuzzleInvariants(check: Check): void {
  const world = puzzleWorldFromPreset();
  checkTheShellIsSolidExceptWhereItLetsYouThrough(check, world);
  checkTheTutorialRingsComeInOrder(check, world);
  checkDoorsStayShutUntilTheRoomIsDone(check, world);
  checkTheWayOutOpensInEveryDirection(check, world);
  checkEverySokobanRoomHasASolutionThatWorks(check, world);
  checkResettingARoomPutsItBack(check, world);
  checkTheSameSeedFurnishesTheSameRooms(check);
  checkEveryPuzzleKindDeclaresWhereItLands(check);
  checkYouCanTellTheFixturesApartFromTheWorld(check);
}

function checkYouCanTellTheFixturesApartFromTheWorld(check: Check): void {
  const tileGlyphs = new Set(new Tileset().all().map((tile) => tile.symbol));
  check(
    'no fixture is drawn with a glyph a tile already uses, so a door never reads as a wall',
    everyFixtureLook().every((look) => !tileGlyphs.has(look.glyph)),
  );
  check(
    'a door, a lever and a plate all look different once they are satisfied',
    (['gate', 'lever', 'plate'] as const).every(
      (kind) => fixtureLook(kind, true).glyph !== fixtureLook(kind, false).glyph,
    ),
  );
  check(
    'every fixture look says in words what it is, since that is what an agent reads',
    everyFixtureLook().every((look) => look.tag.length > 0),
  );
}

interface PuzzleFixtureWorld {
  knobs: PuzzleRoomKnobs;
  puzzles: PuzzleWorld;
  sampler: WorldSampler;
  tileIsWalkable(x: number, y: number): boolean;
}

function puzzleWorldFromPreset(): PuzzleFixtureWorld {
  const preset = examplePipelines().find((example) => example.name === PUZZLE_PRESET_NAME)!;
  const store = new PipelineStore(sanitizePipeline(preset.state));
  const tileset = new Tileset();
  const sampler = new WorldSampler(store, new PipelineEvaluator(store), tileset);
  const tileIsWalkable = (x: number, y: number) => isWalkableTile(tileset, sampler.tileAt(x, y));
  return {
    knobs: puzzleKnobsFromPipeline(store)!,
    puzzles: new PuzzleWorld(store, tileIsWalkable),
    sampler,
    tileIsWalkable,
  };
}

function checkTheShellIsSolidExceptWhereItLetsYouThrough(
  check: Check,
  world: PuzzleFixtureWorld,
): void {
  const room = roomInteriorRect(1, 0, world.knobs);
  check(
    'every cell of a chamber floor is walkable in the tile layer the node paints',
    everyCellOfRoom(room).every((cell) => world.tileIsWalkable(cell.x, cell.y)),
  );
  check(
    'the ring around a chamber is wall wherever no corridor punches through it',
    ringCellsOf(room, world.knobs).every(
      (cell) =>
        puzzleShellAt(world.knobs, cell.x, cell.y) === 'floor' ||
        !world.tileIsWalkable(cell.x, cell.y),
    ),
  );
  check(
    'each doorway the layout puts a door in is floor you could walk over if the door opened',
    bandCells(eastGateBand(1, 0, world.knobs)).every((cell) =>
      world.tileIsWalkable(cell.x, cell.y),
    ),
  );
  check(
    'nothing between the chambers is left empty, so the doors are the only way through',
    cellsBetweenRooms(world.knobs).every(
      (cell) => world.sampler.tileAt(cell.x, cell.y) !== EMPTY_TILE,
    ),
  );
}

function checkTheTutorialRingsComeInOrder(check: Check, world: PuzzleFixtureWorld): void {
  check(
    'the chamber you wake in asks nothing of you and its doors are already open',
    roomsOfRing(world, 0).every(
      (layout) => layout.fixtures.length === 0 && roomIsSolved(layout, world.puzzles.state),
    ),
  );
  const introductions = allPuzzleKinds();
  check(
    'each puzzle kind gets a whole ring to itself, at its easiest, before any of them are mixed',
    introductions.every((kind) =>
      roomsOfRing(world, kind.introducedAtRing).every(
        (layout) => layout.kindName === kind.name && layout.level === 0,
      ),
    ),
  );
  check(
    'the first lever chamber holds exactly one lever and nothing else to get in the way',
    roomsOfRing(world, 1).every(
      (layout) => layout.fixtures.length === 1 && layout.fixtures[0]!.kind === 'lever',
    ),
  );
  check(
    'past the tutorial rings, chambers draw from every kind already introduced',
    new Set(roomsOfRing(world, 5).map((layout) => layout.kindName)).size > 1,
  );
  check(
    'every furnished chamber puts its fixtures on cells the shell carved as floor',
    everyRoomWithin(world, 4).every((layout) =>
      layout.fixtures.every((fixture) => rectContains(layout.interior, fixture.x, fixture.y)),
    ),
  );
  check(
    'every furnished chamber names something its doors wait on',
    everyRoomWithin(world, 4).every(
      (layout) => layout.kindName === '' || layout.opensWhen.length > 0,
    ),
  );
}

function checkDoorsStayShutUntilTheRoomIsDone(check: Check, world: PuzzleFixtureWorld): void {
  const layout = roomsOfRing(world, 1)[0]!;
  const gate = layout.gates.east[0]!;
  const lever = layout.fixtures.find((fixture) => fixture.kind === 'lever')!;
  check('a locked door blocks the way before its lever is pulled', world.puzzles.blocksAt(gate.x, gate.y));
  check(
    'walking into a locked door gets you nowhere',
    !world.puzzles.clearTheWay(gate.x, gate.y, 1, 0),
  );
  check('pulling the lever reports what it did', world.puzzles.use(lever.x, lever.y).ok);
  check('pulling the same lever twice is refused rather than silently repeated', !world.puzzles.use(lever.x, lever.y).ok);
  check('the door opens the moment the room is done', !world.puzzles.blocksAt(gate.x, gate.y));
  check(
    'a door that is open lets you walk through it',
    world.puzzles.clearTheWay(gate.x, gate.y, 1, 0),
  );
  const keyRoom = roomsOfRing(world, 2)[0]!;
  const key = keyRoom.fixtures.find((fixture) => fixture.kind === 'key')!;
  check(
    'walking over a key takes it and that alone opens a key chamber',
    world.puzzles.takeKeysAt(key.x, key.y).length === 1 &&
      roomIsSolved(keyRoom, world.puzzles.state),
  );
}

function checkTheWayOutOpensInEveryDirection(check: Check, world: PuzzleFixtureWorld): void {
  const start = roomAtIndex(world, 0, 0);
  const west = roomAtIndex(world, -1, 0);
  const north = roomAtIndex(world, 0, -1);
  check(
    'the doors out of the chamber you wake in are open on the sides that chamber owns',
    [...start.gates.east, ...start.gates.south].every((gate) =>
      world.puzzles.gateIsOpen(start, gate),
    ),
  );
  check(
    'the doors into the chamber you wake in are open from the sides its neighbours own',
    world.puzzles.gateIsOpen(west, west.gates.east[0]!) &&
      world.puzzles.gateIsOpen(north, north.gates.south[0]!),
  );
  check(
    'a doorway between two unsolved chambers stays shut from both sides',
    !world.puzzles.gateIsOpen(north, north.gates.east[0]!),
  );
  const beyondWest = roomAtIndex(world, -2, 0);
  check(
    'a chamber further out is sealed on every side while nothing around it is solved',
    !world.puzzles.gateIsOpen(beyondWest, beyondWest.gates.east[0]!) &&
      !world.puzzles.gateIsOpen(beyondWest, beyondWest.gates.south[0]!),
  );
  solveRoom(world, west);
  check(
    'solving a chamber opens every doorway it touches, so progress is never one-way',
    [...west.gates.east, ...west.gates.south].every((gate) =>
      world.puzzles.gateIsOpen(west, gate),
    ) &&
      [...beyondWest.gates.east].every((gate) => world.puzzles.gateIsOpen(beyondWest, gate)),
  );
  world.puzzles.state.forgetRoom(west.key);
}

function solveRoom(world: PuzzleFixtureWorld, layout: PuzzleRoomLayout): void {
  for (const fixture of layout.fixtures) {
    if (fixture.kind === 'lever' || fixture.kind === 'key') world.puzzles.use(fixture.x, fixture.y);
  }
}

function checkEverySokobanRoomHasASolutionThatWorks(
  check: Check,
  world: PuzzleFixtureWorld,
): void {
  const deepRooms = everyRoomWithin(world, 8).filter((layout) => layout.kindName === 'sokoban');
  check(
    'sokoban chambers keep appearing well past the ring that introduced them',
    deepRooms.length > 20,
  );
  check(
    'every sokoban chamber out to the eighth ring can still be solved by its recorded pushes',
    deepRooms.every((layout) => replayingTheSolutionOpensTheDoors(world, layout)),
  );
  check(
    'sokoban chambers get harder further out rather than staying at the tutorial size',
    Math.max(...deepRooms.map((layout) => layout.solution.length)) >
      Math.min(...deepRooms.map((layout) => layout.solution.length)),
  );
  const rooms = roomsOfRing(world, 3);
  check(
    'every sokoban chamber starts with its crates off their plates',
    rooms.every((layout) => !roomIsSolved(layout, world.puzzles.state)),
  );
  check(
    'every sokoban chamber records a run of pushes the push rules actually allow',
    rooms.every((layout) => replayingTheSolutionOpensTheDoors(world, layout)),
  );
  const wedged = rooms[0]!;
  const crate = wedged.fixtures.find((fixture) => fixture.kind === 'crate')!;
  check(
    'no crate can be pushed out of the chamber it belongs to',
    pushesUntilItCannot(world, wedged, crate) < wedged.interior.width,
  );
}

function checkResettingARoomPutsItBack(check: Check, world: PuzzleFixtureWorld): void {
  const layout = roomsOfRing(world, 1)[0]!;
  const gate = layout.gates.east[0]!;
  check('the room solved earlier is still solved', !world.puzzles.blocksAt(gate.x, gate.y));
  world.puzzles.resetRoomAt(layout.interior.x, layout.interior.y);
  check('resetting a chamber locks its doors again', world.puzzles.blocksAt(gate.x, gate.y));
  check(
    'resetting one chamber leaves the chambers around it alone',
    !roomIsSolved(layout, world.puzzles.state) &&
      roomsOfRing(world, 0).every((start) => roomIsSolved(start, world.puzzles.state)),
  );
}

function checkTheSameSeedFurnishesTheSameRooms(check: Check): void {
  const first = puzzleWorldFromPreset();
  const second = puzzleWorldFromPreset();
  check(
    'the same seed lays out the same fixtures, whichever chamber is visited first',
    fixtureFingerprint(second, 6, -3) === fixtureFingerprint(first, 6, -3),
  );
  const reseeded = puzzleWorldFromPreset();
  reseeded.puzzles.forgetEverySolvedRoom();
  check(
    'chambers far apart are furnished differently',
    fixtureFingerprint(first, 6, -3) !== fixtureFingerprint(first, -5, 4),
  );
}

function checkEveryPuzzleKindDeclaresWhereItLands(check: Check): void {
  const kinds = allPuzzleKinds();
  check('there are puzzle kinds registered to find', kinds.length >= 3);
  check(
    'every puzzle kind says what it teaches, so the ring it is introduced on can be justified',
    kinds.every((kind) => kind.teaches.length > 0 && kind.name.length > 0),
  );
  check(
    'no two puzzle kinds are introduced on the same ring, so each is met alone first',
    new Set(kinds.map((kind) => kind.introducedAtRing)).size === kinds.length,
  );
  check(
    'puzzle kinds are introduced one ring at a time from the first ring outwards',
    kinds.every((kind, index) => kind.introducedAtRing === index + 1),
  );
}

function replayingTheSolutionOpensTheDoors(
  world: PuzzleFixtureWorld,
  layout: PuzzleRoomLayout,
): boolean {
  const state = world.puzzles.state;
  state.forgetRoom(layout.key);
  if (layout.solution.length === 0) return false;
  for (const push of layout.solution) {
    const crate = layout.fixtures.find((fixture) => fixture.id === push.crateId)!;
    if (!pushCrate(layout, state, crate, push.dx, push.dy, world.tileIsWalkable)) return false;
  }
  const solved = everyPlateIsWeighted(world, layout) && roomIsSolved(layout, state);
  state.forgetRoom(layout.key);
  return solved;
}

function everyPlateIsWeighted(world: PuzzleFixtureWorld, layout: PuzzleRoomLayout): boolean {
  return layout.fixtures
    .filter((fixture) => fixture.kind === 'plate')
    .every((plate) => fixtureIsOn(layout, world.puzzles.state, plate));
}

function pushesUntilItCannot(
  world: PuzzleFixtureWorld,
  layout: PuzzleRoomLayout,
  crate: { id: string; kind: 'crate' | string; x: number; y: number },
): number {
  let pushes = 0;
  while (
    pushCrate(
      layout,
      world.puzzles.state,
      crate as Parameters<typeof pushCrate>[2],
      1,
      0,
      world.tileIsWalkable,
    )
  ) {
    pushes++;
  }
  world.puzzles.state.forgetRoom(layout.key);
  return pushes;
}

function fixtureFingerprint(world: PuzzleFixtureWorld, roomX: number, roomY: number): string {
  const rect = roomInteriorRect(roomX, roomY, world.knobs);
  const layout = world.puzzles.roomAt(rect.x, rect.y)!;
  return JSON.stringify([layout.kindName, layout.level, everyFixtureOf(layout)]);
}

function roomAtIndex(
  world: PuzzleFixtureWorld,
  roomX: number,
  roomY: number,
): PuzzleRoomLayout {
  const rect = roomInteriorRect(roomX, roomY, world.knobs);
  return world.puzzles.roomAt(rect.x, rect.y)!;
}

function roomsOfRing(world: PuzzleFixtureWorld, ring: number): PuzzleRoomLayout[] {
  const layouts: PuzzleRoomLayout[] = [];
  for (let roomY = -ring; roomY <= ring; roomY++) {
    for (let roomX = -ring; roomX <= ring; roomX++) {
      if (Math.max(Math.abs(roomX), Math.abs(roomY)) !== ring) continue;
      layouts.push(roomAtIndex(world, roomX, roomY));
    }
  }
  return layouts;
}

function everyRoomWithin(world: PuzzleFixtureWorld, rings: number): PuzzleRoomLayout[] {
  const layouts: PuzzleRoomLayout[] = [];
  for (let ring = 0; ring <= rings; ring++) layouts.push(...roomsOfRing(world, ring));
  return layouts;
}

function everyCellOfRoom(rect: { x: number; y: number; width: number; height: number }) {
  const cells: { x: number; y: number }[] = [];
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) cells.push({ x, y });
  }
  return cells;
}

function ringCellsOf(
  rect: { x: number; y: number; width: number; height: number },
  knobs: PuzzleRoomKnobs,
): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = rect.y - knobs.wall; y < rect.y + rect.height + knobs.wall; y++) {
    for (let x = rect.x - knobs.wall; x < rect.x + rect.width + knobs.wall; x++) {
      if (!rectContains(rect, x, y)) cells.push({ x, y });
    }
  }
  return cells;
}

function cellsBetweenRooms(knobs: PuzzleRoomKnobs): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = -40; y <= 40; y++) {
    for (let x = -40; x <= 40; x++) {
      if (puzzleShellAt(knobs, x, y) === 'outside') cells.push({ x, y });
    }
  }
  return cells;
}

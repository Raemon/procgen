import { EMPTY_TILE } from '../procgen/values/chunkValues';
import {
  bandCells,
  eastGateBand,
} from '../procgen/nodes/puzzle/puzzleRoomCorridors';
import type { PuzzleRoomKnobs } from '../procgen/nodes/puzzle/puzzleRoomKnobs';
import {
  doorwayCentreOffset,
  rectContains,
  roomInteriorRect,
} from '../procgen/nodes/puzzle/puzzleRoomLattice';
import { puzzleShellAt } from '../procgen/nodes/puzzle/puzzleRoomShell';
import { roomLatticeMazeFor } from '../procgen/nodes/puzzle/roomLatticeMazeCache';
import type { RoomLatticeMaze } from '../procgen/nodes/puzzle/roomLatticeMaze';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { WorldSampler } from '../procgen/worldSampler';
import { TileAssets } from '../assets/tiles/tileAssets';
import { isWalkableTile } from '../world/tileWalkability';
import { everyFixtureLook, fixtureLook } from '../world/puzzles/fixtures/fixtureAppearance';
import { allPuzzleKinds } from '../world/puzzles/kinds/puzzleKind';
import { pushCrate } from '../world/puzzles/interaction/pushCrate';
import { forwardSolutionWorks } from '../world/puzzles/kinds/forwardSolutionWorks';
import {
  chanceToRuinTheRoom,
  ruinChanceWantedAt,
} from '../world/puzzles/kinds/chanceToRuinTheRoom';
import {
  squaresACrateCannotComeBackFrom,
  standingRoomForACrate,
} from '../world/puzzles/kinds/squaresACrateCannotComeBackFrom';
import { RoomCells } from '../world/puzzles/kinds/roomCells';
import { PuzzleWorld } from '../world/puzzles/puzzleWorld';
import { playerCanEnter } from '../world/puzzles/playerCanEnter';
import { PuzzleState } from '../world/puzzles/state/puzzleState';
import { puzzleKnobsFromPipeline } from '../world/puzzles/puzzleKnobsFromPipeline';
import { everyFixtureOf, type PuzzleRoomLayout } from '../world/puzzles/rooms/puzzleRoomLayout';
import type { PuzzleFixture } from '../world/puzzles/fixtures/puzzleFixture';
import { fixtureIsOn, livePosition, roomIsSolved } from '../world/puzzles/state/fixtureSignals';

type Check = (name: string, condition: boolean) => void;

const PUZZLE_PRESET_NAME = 'puzzle labyrinth';

export function checkPuzzleInvariants(check: Check): void {
  const world = puzzleWorldFromPreset();
  checkTheShellIsSolidExceptWhereItLetsYouThrough(check, world);
  checkTheLabyrinthIsALabyrinth(check, world);
  checkTheNodeAndTheRuntimeAgreeOnTheShell(check, world);
  checkTheTutorialRingsComeInOrder(check, world);
  checkDoorsStayShutUntilTheRoomIsDone(check, world);
  checkTheWayOutOpensInEveryDirection(check, world);
  checkEverySokobanRoomHasASolutionThatWorks(check, world);
  checkResettingARoomPutsItBack(check, world);
  checkTheSameSeedFurnishesTheSameRooms(check);
  checkEveryPuzzleKindDeclaresWhereItLands(check);
  checkYouCanTellTheFixturesApartFromTheWorld(check);
  checkNoChamberIsAFreePass(check, world);
  checkTheCrateYouWalkIntoActuallyMoves(check, world);
  checkAWrongPushCanCostYouTheRoom(check, world);
  checkTheSearchAsksForMoreRuinUntilItsCeiling(check);
  checkDifficultyRisesThenHoldsAtAKnownRing(check, world);
}

interface CrateFloorStudy {
  layout: PuzzleRoomLayout;
  space: ReturnType<typeof crateSpaceOf>;
  plates: { x: number; y: number }[];
  stranding: Set<string>;
}

function studyTheCrateFloorOf(layout: PuzzleRoomLayout): CrateFloorStudy {
  const space = crateSpaceOf(layout);
  const plates = layout.fixtures
    .filter((fixture) => fixture.kind === 'plate')
    .map((fixture) => ({ x: fixture.x, y: fixture.y }));
  return {
    layout,
    space,
    plates,
    stranding: squaresACrateCannotComeBackFrom(space, plates),
  };
}

function everySquareTheSolutionParksACrateOn(study: CrateFloorStudy): string[] {
  const crates = new Map(study.space.crates);
  const parked: string[] = [];
  for (const push of study.layout.solution) {
    const crate = crates.get(push.crateId)!;
    const landsOn = { x: crate.x + push.dx, y: crate.y + push.dy };
    crates.set(push.crateId, landsOn);
    parked.push(`${landsOn.x},${landsOn.y}`);
  }
  return parked;
}

function checkAWrongPushCanCostYouTheRoom(check: Check, world: PuzzleFixtureWorld): void {
  const studies = everyRoomWithin(world, 12)
    .filter((layout) => layout.kindName === 'sokoban' && layout.solution.length > 0)
    .map(studyTheCrateFloorOf);
  check('there are sokoban chambers to study the crate floor of', studies.length > 100);
  check(
    'every crate a chamber starts with stands where a plate is still reachable, so no chamber is born unsolvable',
    studies.every((study) =>
      [...study.space.crates.values()].every(
        (crate) => !study.stranding.has(`${crate.x},${crate.y}`),
      ),
    ),
  );
  check(
    'no push of a recorded solution parks a crate on ground the analysis calls stranding, so it never cries wolf',
    studies.every((study) =>
      everySquareTheSolutionParksACrateOn(study).every((cell) => !study.stranding.has(cell)),
    ),
  );
  check(
    'a corner of a chamber with no plate in it is ground a crate can never be pushed off',
    studies.every((study) => everyPlainCornerOf(study).every((cell) => study.stranding.has(cell))),
  );
  const risky = studies.filter((study) => study.layout.level > 0 && aPushCanRuinIt(study));
  const deep = studies.filter((study) => study.layout.level > 0);
  check(
    'past the tutorial ring most sokoban chambers offer a push that costs you the room',
    risky.length > deep.length * 0.8,
  );
  check(
    'and the tutorial chamber that introduces crates still lets you shove them about freely',
    studies
      .filter((study) => study.layout.level === 0)
      .every((study) => !aPushCanRuinIt(study)),
  );
}

function aPushCanRuinIt(study: CrateFloorStudy): boolean {
  return chanceToRuinTheRoom(study.space, study.layout.entrance, study.plates) > 0;
}

function everyPlainCornerOf(study: CrateFloorStudy): string[] {
  const rect = study.layout.interior;
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width - 1, y: rect.y },
    { x: rect.x, y: rect.y + rect.height - 1 },
    { x: rect.x + rect.width - 1, y: rect.y + rect.height - 1 },
  ];
  return corners
    .filter((corner) => standingRoomForACrate(study.space, corner))
    .filter((corner) => !study.plates.some((plate) => plate.x === corner.x && plate.y === corner.y))
    .map((corner) => `${corner.x},${corner.y}`);
}

function checkTheSearchAsksForMoreRuinUntilItsCeiling(check: Check): void {
  check(
    'the deeper a chamber sits the more of its pushes the search insists can go wrong',
    ruinChanceWantedAt(3) > ruinChanceWantedAt(1) && ruinChanceWantedAt(1) > ruinChanceWantedAt(0),
  );
  check(
    'the chamber that introduces crates is asked for no risk at all, so nothing there can be lost',
    ruinChanceWantedAt(0) === 0,
  );
  check(
    'and the search stops asking for more past a stated ceiling rather than hunting forever',
    ruinChanceWantedAt(40) === ruinChanceWantedAt(200) && ruinChanceWantedAt(40) < 1,
  );
}

function checkNoChamberIsAFreePass(check: Check, world: PuzzleFixtureWorld): void {
  const unsolved = new PuzzleState();
  const furnished = everyRoomWithin(world, 12).filter((layout) => layout.kindName !== '');
  check('there are furnished chambers to inspect', furnished.length > 100);
  check(
    'no furnished chamber stands open before the player has done anything',
    furnished.every((layout) => !roomIsSolved(layout, unsolved)),
  );
  check(
    'every furnished chamber asks for at least one thing, so none is a free pass',
    furnished.every((layout) => layout.opensWhen.length > 0),
  );
  check(
    'every sokoban chamber starts with all of its crates off their plates',
    furnished
      .filter((layout) => layout.kindName === 'sokoban')
      .every((layout) => layout.solution.length > 0),
  );
}

function checkTheCrateYouWalkIntoActuallyMoves(check: Check, world: PuzzleFixtureWorld): void {
  const layout = everyRoomWithin(world, 12).find(
    (room) => room.kindName === 'sokoban' && room.solution.length > 0,
  )!;
  const push = layout.solution[0]!;
  const crate = layout.fixtures.find((fixture) => fixture.id === push.crateId)!;
  check(
    'a crate blocks the tile it stands on, so a plain walkability probe refuses it',
    world.puzzles.blocksAt(crate.x, crate.y),
  );
  check(
    'but the probe the player walks with can see that crate as somewhere to go, because it pushes',
    world.puzzles.couldPushInto(crate.x, crate.y, push.dx, push.dy),
  );
  const walkable = (x: number, y: number) =>
    world.tileIsWalkable(x, y) && !world.puzzles.blocksAt(x, y);
  const canEnter = playerCanEnter(walkable, world.puzzles, () => ({
    x: crate.x - push.dx,
    y: crate.y - push.dy,
  }));
  check(
    'the plain probe refuses the crate tile, which is what stopped the player pushing at all',
    !walkable(crate.x, crate.y),
  );
  check(
    'the probe the player walks with lets them step into a crate they can push',
    canEnter(crate.x, crate.y),
  );
  check(
    'and it still refuses a crate that has nowhere to go',
    !canEnter(crate.x - 2 * push.dx, crate.y - 2 * push.dy) ||
      walkable(crate.x - 2 * push.dx, crate.y - 2 * push.dy),
  );
  check(
    'a step that is not allowed to push is refused at a crate, so one diagonal never shoves two',
    !world.puzzles.clearTheWay(crate.x, crate.y, push.dx, push.dy, false),
  );
  check(
    'and the same step does push when it is allowed to',
    world.puzzles.clearTheWay(crate.x, crate.y, push.dx, push.dy, true),
  );
  world.puzzles.state.forgetRoom(layout.key);
}

function checkDifficultyRisesThenHoldsAtAKnownRing(
  check: Check,
  world: PuzzleFixtureWorld,
): void {
  const heaviest = (ring: number) =>
    Math.max(...roomsOfRing(world, ring).map((layout) => layout.fixtures.length));
  check(
    'chambers ask for more as you walk outwards, through the rings that introduce the kinds',
    heaviest(9) > heaviest(4),
  );
  check(
    'and from the ninth ring outwards every chamber is drawn at that same top difficulty',
    heaviest(20) === heaviest(9) && heaviest(40) === heaviest(9),
  );
}

function checkYouCanTellTheFixturesApartFromTheWorld(check: Check): void {
  const tileGlyphs = new Set(new TileAssets().all().map((tile) => tile.symbol));
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
  maze: RoomLatticeMaze;
  puzzles: PuzzleWorld;
  sampler: WorldSampler;
  tileIsWalkable(x: number, y: number): boolean;
}

function puzzleWorldFromPreset(): PuzzleFixtureWorld {
  const preset = examplePipelines().find((example) => example.name === PUZZLE_PRESET_NAME)!;
  const store = new PipelineStore(sanitizePipeline(preset.state));
  const tileAssets = new TileAssets();
  const sampler = new WorldSampler(store, new PipelineEvaluator(store), tileAssets);
  const tileIsWalkable = (x: number, y: number) => isWalkableTile(tileAssets, sampler.tileAt(x, y));
  const knobs = puzzleKnobsFromPipeline(store)!;
  return {
    knobs,
    maze: roomLatticeMazeFor(knobs),
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
        puzzleShellAt(world.knobs, world.maze, cell.x, cell.y) === 'floor' ||
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
    cellsBetweenRooms(world).every(
      (cell) => world.sampler.tileAt(cell.x, cell.y) !== EMPTY_TILE,
    ),
  );
}

function checkTheLabyrinthIsALabyrinth(check: Check, world: PuzzleFixtureWorld): void {
  const rooms = everyRoomIndexWithin(8);
  const joins = rooms.map((room) => world.maze.corridorsTouching(room.roomX, room.roomY));
  check(
    'most neighbouring chambers are not joined at all, so the corridors read as a maze rather than a grid',
    joins.reduce((total, count) => total + count, 0) < rooms.length * 4 * 0.6,
  );
  check('the labyrinth has dead ends: chambers with only one way in', joins.includes(1));
  check('no chamber is sealed off with no corridor at all', !joins.includes(0));
  check(
    'the chamber you wake in is joined to the rest of the labyrinth',
    world.maze.corridorsTouching(0, 0) > 0,
  );
  check(
    'every chamber near the origin can be walked to from it through corridors',
    roomsReachableFrom(world, 10).size === everyRoomIndexWithin(8).length,
  );
}

function checkTheNodeAndTheRuntimeAgreeOnTheShell(
  check: Check,
  world: PuzzleFixtureWorld,
): void {
  const disagreements = everyCellWithin(40).filter(
    (cell) => tileIsFloor(world, cell.x, cell.y) !== shellIsFloor(world, cell.x, cell.y),
  );
  check(
    'the tiles the node paints are the shell the runtime believes it laid out, seed and all',
    disagreements.length === 0,
  );
}

function tileIsFloor(world: PuzzleFixtureWorld, x: number, y: number): boolean {
  return world.tileIsWalkable(x, y);
}

function shellIsFloor(world: PuzzleFixtureWorld, x: number, y: number): boolean {
  return puzzleShellAt(world.knobs, world.maze, x, y) === 'floor';
}

function roomsReachableFrom(world: PuzzleFixtureWorld, span: number): Set<string> {
  const reached = new Set<string>(['0,0']);
  const queue = [{ roomX: 0, roomY: 0 }];
  while (queue.length > 0) {
    const here = queue.shift()!;
    for (const next of corridorNeighbours(world, here)) {
      if (Math.max(Math.abs(next.roomX), Math.abs(next.roomY)) > span) continue;
      const key = `${next.roomX},${next.roomY}`;
      if (reached.has(key)) continue;
      reached.add(key);
      queue.push(next);
    }
  }
  return new Set(
    [...reached].filter((key) => {
      const [roomX, roomY] = key.split(',').map(Number);
      return Math.max(Math.abs(roomX!), Math.abs(roomY!)) <= 8;
    }),
  );
}

function corridorNeighbours(
  world: PuzzleFixtureWorld,
  room: { roomX: number; roomY: number },
): { roomX: number; roomY: number }[] {
  const found: { roomX: number; roomY: number }[] = [];
  if (world.maze.hasEastCorridor(room.roomX, room.roomY)) {
    found.push({ roomX: room.roomX + 1, roomY: room.roomY });
  }
  if (world.maze.hasEastCorridor(room.roomX - 1, room.roomY)) {
    found.push({ roomX: room.roomX - 1, roomY: room.roomY });
  }
  if (world.maze.hasSouthCorridor(room.roomX, room.roomY)) {
    found.push({ roomX: room.roomX, roomY: room.roomY + 1 });
  }
  if (world.maze.hasSouthCorridor(room.roomX, room.roomY - 1)) {
    found.push({ roomX: room.roomX, roomY: room.roomY - 1 });
  }
  return found;
}

function everyRoomIndexWithin(span: number): { roomX: number; roomY: number }[] {
  const rooms: { roomX: number; roomY: number }[] = [];
  for (let roomY = -span; roomY <= span; roomY++) {
    for (let roomX = -span; roomX <= span; roomX++) rooms.push({ roomX, roomY });
  }
  return rooms;
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

interface Doorway {
  layout: PuzzleRoomLayout;
  gate: PuzzleFixture;
}

function doorwaysTouching(
  world: PuzzleFixtureWorld,
  roomX: number,
  roomY: number,
): Doorway[] {
  const own = roomAtIndex(world, roomX, roomY);
  const west = roomAtIndex(world, roomX - 1, roomY);
  const north = roomAtIndex(world, roomX, roomY - 1);
  return [
    ...[...own.gates.east, ...own.gates.south].map((gate) => ({ layout: own, gate })),
    ...west.gates.east.map((gate) => ({ layout: west, gate })),
    ...north.gates.south.map((gate) => ({ layout: north, gate })),
  ];
}

function stepThroughDoorway(doorway: Doorway): [number, number] {
  return doorway.layout.gates.east.includes(doorway.gate) ? [1, 0] : [0, 1];
}

function checkDoorsStayShutUntilTheRoomIsDone(check: Check, world: PuzzleFixtureWorld): void {
  const layout = roomsOfRing(world, 1).find((room) => everyGateOf(room).length > 0)!;
  const gate = everyGateOf(layout)[0]!;
  const [dx, dy] = stepThroughDoorway({ layout, gate });
  const lever = layout.fixtures.find((fixture) => fixture.kind === 'lever')!;
  check('a locked door blocks the way before its lever is pulled', world.puzzles.blocksAt(gate.x, gate.y));
  check(
    'walking into a locked door gets you nowhere',
    !world.puzzles.clearTheWay(gate.x, gate.y, dx, dy),
  );
  check('pulling the lever reports what it did', world.puzzles.use(lever.x, lever.y).ok);
  check(
    'pulling the same lever twice is refused rather than silently repeated',
    !world.puzzles.use(lever.x, lever.y).ok,
  );
  check('the door opens the moment the room is done', !world.puzzles.blocksAt(gate.x, gate.y));
  check(
    'a door that is open lets you walk through it',
    world.puzzles.clearTheWay(gate.x, gate.y, dx, dy),
  );
  world.puzzles.state.forgetRoom(layout.key);
  const keyRoom = roomsOfRing(world, 2)[0]!;
  const key = keyRoom.fixtures.find((fixture) => fixture.kind === 'key')!;
  check(
    'walking over a key takes it and that alone opens a key chamber',
    world.puzzles.takeKeysAt(key.x, key.y).length === 1 &&
      roomIsSolved(keyRoom, world.puzzles.state),
  );
  world.puzzles.state.forgetRoom(keyRoom.key);
}

function checkTheWayOutOpensInEveryDirection(check: Check, world: PuzzleFixtureWorld): void {
  const fromTheStart = doorwaysTouching(world, 0, 0);
  check('the chamber you wake in has a way out at all', fromTheStart.length > 0);
  check(
    'every doorway touching the chamber you wake in is open, whichever side owns it',
    fromTheStart.every((doorway) => world.puzzles.gateIsOpen(doorway.layout, doorway.gate)),
  );
  const nextRoom = firstNeighbourOfTheStart(world);
  const onward = doorwaysTouching(world, nextRoom.roomX, nextRoom.roomY).filter(
    (doorway) => !fromTheStart.some((start) => start.gate === doorway.gate),
  );
  check(
    'the chamber you walk into is sealed on its far sides until you solve it',
    onward.every((doorway) => !world.puzzles.gateIsOpen(doorway.layout, doorway.gate)),
  );
  solveRoom(world, roomAtIndex(world, nextRoom.roomX, nextRoom.roomY));
  check(
    'solving a chamber opens every doorway it touches, so progress is never one-way',
    onward.every((doorway) => world.puzzles.gateIsOpen(doorway.layout, doorway.gate)),
  );
  world.puzzles.state.forgetRoom(roomAtIndex(world, nextRoom.roomX, nextRoom.roomY).key);
}

function firstNeighbourOfTheStart(world: PuzzleFixtureWorld): {
  roomX: number;
  roomY: number;
} {
  return corridorNeighbours(world, { roomX: 0, roomY: 0 })[0]!;
}

function everyGateOf(layout: PuzzleRoomLayout): PuzzleFixture[] {
  return [...layout.gates.east, ...layout.gates.south];
}

function solveRoom(world: PuzzleFixtureWorld, layout: PuzzleRoomLayout): void {
  for (const fixture of layout.fixtures) {
    if (fixture.kind === 'lever' || fixture.kind === 'key') world.puzzles.use(fixture.x, fixture.y);
  }
  for (const push of layout.solution) {
    const crate = layout.fixtures.find((fixture) => fixture.id === push.crateId)!;
    pushCrate(layout, world.puzzles.state, crate, push.dx, push.dy, world.tileIsWalkable);
  }
}

function checkEverySokobanRoomHasASolutionThatWorks(
  check: Check,
  world: PuzzleFixtureWorld,
): void {
  const deepRooms = everyRoomWithin(world, 12).filter((layout) => layout.kindName === 'sokoban');
  check(
    'sokoban chambers keep appearing well past the ring that introduced them',
    deepRooms.length > 20,
  );
  check(
    'every sokoban chamber out to the twelfth ring can still be solved by its recorded pushes',
    deepRooms.every((layout) => replayingTheSolutionOpensTheDoors(world, layout)),
  );
  check(
    'and a player walking in by any doorway that chamber has can reach every push in turn',
    deepRooms.every((layout) =>
      entrancesOf(world, layout).every((entrance) =>
        forwardSolutionWorks(crateSpaceOf(layout), entrance, layout.solution),
      ),
    ),
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
  const solved = deepRooms.find((layout) => layout.solution.length > 0)!;
  solveRoom(world, solved);
  const settled = crateOnAPlateOf(world, solved);
  check(
    'playing a sokoban chamber through leaves a crate standing on a plate, so this is not vacuous',
    settled !== null,
  );
  check(
    'a crate resting on a plate still blocks the way rather than being walked over',
    settled !== null && world.puzzles.blocksAt(settled.x, settled.y),
  );
  check(
    'and it can still be pushed back off the plate it sits on',
    settled !== null && cratePushesSomewhere(world, settled),
  );
  world.puzzles.state.forgetRoom(solved.key);
  const wedged = rooms[0]!;
  const crate = wedged.fixtures.find((fixture) => fixture.kind === 'crate')!;
  check(
    'no crate can be pushed out of the chamber it belongs to',
    pushesUntilItCannot(world, wedged, crate) < wedged.interior.width,
  );
}

function checkResettingARoomPutsItBack(check: Check, world: PuzzleFixtureWorld): void {
  const layout = roomsOfRing(world, 1).find((room) => everyGateOf(room).length > 0)!;
  const gate = everyGateOf(layout)[0]!;
  solveRoom(world, layout);
  check('a solved chamber lets you past its door', !world.puzzles.blocksAt(gate.x, gate.y));
  world.puzzles.resetRoomAt(layout.interior.x, layout.interior.y);
  check('resetting a chamber locks its doors again', world.puzzles.blocksAt(gate.x, gate.y));
  check(
    'resetting one chamber leaves the chamber you woke in alone',
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

function entrancesOf(
  world: PuzzleFixtureWorld,
  layout: PuzzleRoomLayout,
): { x: number; y: number }[] {
  const offset = doorwayCentreOffset(world.knobs);
  const row = layout.interior.y + offset;
  const column = layout.interior.x + offset;
  const right = layout.interior.x + layout.interior.width - 1;
  const bottom = layout.interior.y + layout.interior.height - 1;
  const maze = world.maze;
  return [
    { open: maze.hasEastCorridor(layout.roomX - 1, layout.roomY), cell: { x: layout.interior.x, y: row } },
    { open: maze.hasEastCorridor(layout.roomX, layout.roomY), cell: { x: right, y: row } },
    { open: maze.hasSouthCorridor(layout.roomX, layout.roomY - 1), cell: { x: column, y: layout.interior.y } },
    { open: maze.hasSouthCorridor(layout.roomX, layout.roomY), cell: { x: column, y: bottom } },
  ]
    .filter((doorway) => doorway.open)
    .map((doorway) => doorway.cell);
}

function crateOnAPlateOf(
  world: PuzzleFixtureWorld,
  layout: PuzzleRoomLayout,
): { x: number; y: number } | null {
  for (const crate of layout.fixtures.filter((fixture) => fixture.kind === 'crate')) {
    const at = livePosition(layout, world.puzzles.state, crate);
    const onAPlate = layout.fixtures.some(
      (plate) => plate.kind === 'plate' && plate.x === at.x && plate.y === at.y,
    );
    if (onAPlate) return at;
  }
  return null;
}

function cratePushesSomewhere(
  world: PuzzleFixtureWorld,
  at: { x: number; y: number },
): boolean {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(([dx, dy]) => world.puzzles.couldPushInto(at.x, at.y, dx!, dy!));
}

function crateSpaceOf(layout: PuzzleRoomLayout) {
  return {
    cells: new RoomCells(layout.interior),
    pillars: new Set(
      layout.fixtures.filter((f) => f.kind === 'pillar').map((f) => `${f.x},${f.y}`),
    ),
    crates: new Map(
      layout.fixtures.filter((f) => f.kind === 'crate').map((f) => [f.id, { x: f.x, y: f.y }]),
    ),
  };
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

function cellsBetweenRooms(world: PuzzleFixtureWorld): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (const cell of everyCellWithin(40)) {
    if (puzzleShellAt(world.knobs, world.maze, cell.x, cell.y) === 'outside') cells.push(cell);
  }
  return cells;
}

function everyCellWithin(span: number): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = -span; y <= span; y++) {
    for (let x = -span; x <= span; x++) cells.push({ x, y });
  }
  return cells;
}

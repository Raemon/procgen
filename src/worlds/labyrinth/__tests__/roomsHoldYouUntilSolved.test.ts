import '..';
import { defaultItems } from '@/features/asset-library/items/defaultItems';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import { LABYRINTH_NODE_TYPE } from '../node/labyrinthKnobs';
import {
  LABYRINTH_CELL_SIZE,
  labyrinthCellOrigin,
} from '../generate/layout/labyrinthLattice';
import type { DoorwaySide } from '../generate/layout/roomLayout';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { infiniteLabyrinth } from '../node/seed';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { rectContains } from '../generate/layout/roomLayout';
import { wiresJoin } from '@/features/game/__tests__/circuitFixtures';
import { cellKeyOf, type Circuit } from '@/features/game/circuits/circuit';
import { joinedCellsOf } from '@/features/game/circuits/wireMarkers';
import { jumpLandingDelta } from '@/features/game/sim/jumpLanding';
import { stepIsAllowed, type StepRules } from '@/features/game/sim/stepIsAllowed';
import type { PuzzleFixture } from '@/features/game/fixtures/fixtureKinds';
import { WorldRulesSet, mineSlotsOf, stepRulesOf } from '@/features/game/worldRulesSet';
import type { LabyrinthRules } from '../rules/overlay';
import type { PuzzleWorld } from '../rules/puzzleWorld';
import {
  everyGateOf,
  roomAcrossTheGate,
  sideOfGate,
  type PuzzleRoomLayout,
} from '../generate/rooms/puzzleRoomLayout';

const SEARCHED_ROOMS = 8;

export function checkRoomsHoldYouUntilSolved(check: CheckReporter): void {
  checkFurnishedRoomsStartShut(check);
  checkAShutDoorLetsYouInButNotOut(check);
  checkPullingEveryLeverOpensTheRoom(check);
  checkAJumpCannotVaultAShutDoor(check);
  checkEverySignalIsWiredToEveryDoorway(check);
}

function checkFurnishedRoomsStartShut(check: CheckReporter): void {
  const { puzzles } = labyrinthPuzzles();
  const doors = everyDoorWorthWorking(puzzles);
  const open = doors.filter(({ layout, gate }) => puzzles.gateIsOpen(layout, gate));
  check(
    'a doorway of an unsolved chamber stands open only where the chamber across it has nothing to work',
    doors.length > 100 &&
      open.every(({ layout, gate }) => !hasSomethingToDo(roomBeyond(puzzles, layout, gate))),
  );
}

function checkAShutDoorLetsYouInButNotOut(check: CheckReporter): void {
  const { puzzles, rules } = labyrinthPuzzles();
  const doors = everyDoorWorthWorking(puzzles);
  const shut = doors.filter(({ layout, gate }) => !puzzles.gateIsOpen(layout, gate));
  const letsYouIn = doors.filter(({ layout, gate }) => stepThrough(rules, layout, gate, 'in'));
  const holdsYouIn = shut.filter(({ layout, gate }) => !stepThrough(rules, layout, gate, 'out'));
  check(
    'a shut door still lets a walker step in from outside, so no chamber can seal the labyrinth off',
    doors.length > 100 && letsYouIn.length === doors.length,
  );
  check(
    'a shut door refuses the step out, so a chamber holds you until you have worked it',
    shut.length > 100 && holdsYouIn.length === shut.length,
  );
}

function checkPullingEveryLeverOpensTheRoom(check: CheckReporter): void {
  const { puzzles, rules } = labyrinthPuzzles();
  const layout = everyRoom(puzzles).find(
    (candidate) => candidate.kindName === 'lever' && candidate.opensWhen.length > 0,
  )!;
  const shutBefore = everyGateOf(layout).every((gate) => !puzzles.gateIsOpen(layout, gate));
  for (const lever of layout.fixtures.filter((fixture) => fixture.kind === 'lever')) {
    puzzles.use(lever.x, lever.y);
  }
  const openAfter = everyGateOf(layout).every(
    (gate) => puzzles.gateIsOpen(layout, gate) && stepThrough(rules, layout, gate, 'out'),
  );
  check(
    'pulling every lever in a lever chamber opens its doorways and lets the walker back out',
    shutBefore && openAfter,
  );
}

function checkAJumpCannotVaultAShutDoor(check: CheckReporter): void {
  const { puzzles, rules } = labyrinthPuzzles();
  const vaulted = everyDoorWorthWorking(puzzles)
    .filter(({ layout, gate }) => !puzzles.gateIsOpen(layout, gate))
    .filter(({ layout, gate }) => {
      const [dx, dy] = outwardOf(layout, gate);
      return jumpLandingDelta(rules, gate.x - dx, gate.y - dy, dx, dy) !== null;
    });
  check(
    'a jump cannot vault a shut door out of a chamber',
    vaulted.length === 0,
  );
}

function checkEverySignalIsWiredToEveryDoorway(check: CheckReporter): void {
  const { puzzles } = labyrinthPuzzles();
  const worked = everyRoom(puzzles).filter((layout) => hasSomethingToDo(layout));
  const signalled = worked.filter((layout) => layout.unlock !== 'key');
  const circuitOf = (layout: PuzzleRoomLayout): Circuit | undefined =>
    puzzles.circuitsIn(...boundsOf(layout)).find((circuit) => circuit.key.endsWith(`:${layout.key}`));
  const wired = signalled.filter((layout) => {
    const circuit = circuitOf(layout);
    if (!circuit) return false;
    const joined = joinedCellsOf(circuit);
    return (
      circuit.plates.length === layout.opensWhen.length &&
      circuit.doors.length === everyGateOf(layout).length &&
      circuit.plates.every((plate) => circuit.doors.every((door) => wiresJoin(joined, plate, door)))
    );
  });
  check(
    'every worked chamber wires each of its signals to each of its doorways',
    signalled.length > 50 && wired.length === signalled.length,
  );
  const wiresStayOnTheFloor = (layout: PuzzleRoomLayout): boolean => {
    const pillared = new Set(layout.fixtures.filter((fixture) => fixture.kind === 'pillar').map(cellKeyOf));
    return circuitOf(layout)!.wires.every(
      (cell) => rectContains(layout.interior, cell.x, cell.y) && !pillared.has(cellKeyOf(cell)),
    );
  };
  check('wires stay inside the chamber floor and never run under a pillar', signalled.every(wiresStayOnTheFloor));
  check(
    'a key chamber carries no circuit, since a key and not a signal opens it',
    worked.filter((layout) => layout.unlock === 'key').every((layout) => circuitOf(layout) === undefined),
  );
  const levers = signalled.find((layout) => layout.kindName === 'lever')!;
  const dark = circuitOf(levers)!;
  for (const lever of levers.fixtures.filter((fixture) => fixture.kind === 'lever')) puzzles.use(lever.x, lever.y);
  const lit = circuitOf(levers)!;
  check(
    'a chamber circuit is dark with its doors shut until every signal is worked, then powered with its doors open',
    !dark.powered && dark.doors.every((door) => !door.open) && lit.powered && lit.doors.every((door) => door.open),
  );
}

function boundsOf(layout: PuzzleRoomLayout): [number, number, number, number] {
  const originX = labyrinthCellOrigin(layout.roomX);
  const originY = labyrinthCellOrigin(layout.roomY);
  return [originX, originY, originX + LABYRINTH_CELL_SIZE - 1, originY + LABYRINTH_CELL_SIZE - 1];
}

interface RoomDoor {
  layout: PuzzleRoomLayout;
  gate: PuzzleFixture;
}

function everyDoorWorthWorking(puzzles: PuzzleWorld): RoomDoor[] {
  return everyRoom(puzzles)
    .filter((layout) => hasSomethingToDo(layout))
    .flatMap((layout) => everyGateOf(layout).map((gate) => ({ layout, gate })));
}

function roomBeyond(
  puzzles: PuzzleWorld,
  layout: PuzzleRoomLayout,
  gate: PuzzleFixture,
): PuzzleRoomLayout {
  const across = roomAcrossTheGate(layout, gate);
  return puzzles.roomAt(middleOfRoom(across.roomX), middleOfRoom(across.roomY))!;
}

function hasSomethingToDo(layout: PuzzleRoomLayout): boolean {
  if (everyGateOf(layout).length === 0) return false;
  return layout.unlock === 'key' ? layout.items.length > 0 : layout.opensWhen.length > 0;
}

function stepThrough(
  rules: StepRules,
  layout: PuzzleRoomLayout,
  gate: PuzzleFixture,
  way: 'in' | 'out',
): boolean {
  const [outX, outY] = outwardOf(layout, gate);
  const [dx, dy] = way === 'out' ? [outX, outY] : [-outX, -outY];
  return stepIsAllowed(rules, gate.x, gate.y, dx, dy);
}

function outwardOf(layout: PuzzleRoomLayout, gate: PuzzleFixture): [number, number] {
  return OUTWARD[sideOfGate(layout, gate)];
}

const OUTWARD: Record<DoorwaySide, [number, number]> = {
  east: [1, 0],
  west: [-1, 0],
  north: [0, -1],
  south: [0, 1],
};

function everyRoom(puzzles: PuzzleWorld): PuzzleRoomLayout[] {
  const rooms: PuzzleRoomLayout[] = [];
  for (let roomY = -SEARCHED_ROOMS; roomY <= SEARCHED_ROOMS; roomY++) {
    for (let roomX = -SEARCHED_ROOMS; roomX <= SEARCHED_ROOMS; roomX++) {
      const layout = puzzles.roomAt(middleOfRoom(roomX), middleOfRoom(roomY));
      if (layout) rooms.push(layout);
    }
  }
  return rooms;
}

function middleOfRoom(cell: number): number {
  return labyrinthCellOrigin(cell) + Math.floor(LABYRINTH_CELL_SIZE / 2);
}

function labyrinthPuzzles(): { puzzles: PuzzleWorld; rules: StepRules } {
  const store = new PipelineStore(sanitizePipeline(infiniteLabyrinth().state));
  const world = new WorldRulesSet({ tileIsWalkable: () => true, elevationAt: () => 0 });
  world.attach(store, { items: new ItemAssets(defaultItems()), builtValueOf: () => null });
  const labyrinth = world.find(LABYRINTH_NODE_TYPE) as LabyrinthRules;
  return { puzzles: labyrinth.puzzles, rules: stepRulesOf(world, mineSlotsOf(new Map(), world)) };
}

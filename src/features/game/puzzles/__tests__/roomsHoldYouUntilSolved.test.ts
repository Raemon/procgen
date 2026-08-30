import { defaultItems } from '@/features/asset-library/items/defaultItems';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import {
  LABYRINTH_CELL_SIZE,
  labyrinthCellOrigin,
} from '@/features/asset-library/worlds/labyrinth/labyrinthLattice';
import type { DoorwaySide } from '@/features/asset-library/worlds/labyrinth/roomLayout';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { infiniteLabyrinth } from '@/features/asset-library/worlds/seeds/infiniteLabyrinth';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { jumpLandingDelta } from '@/features/game/sim/jumpLanding';
import { stepIsAllowed, type StepRules } from '@/features/game/sim/stepIsAllowed';
import type { PuzzleFixture } from '../fixtures/puzzleFixture';
import { PuzzleWorld } from '../puzzleWorld';
import {
  everyGateOf,
  roomAcrossTheGate,
  sideOfGate,
  type PuzzleRoomLayout,
} from '../rooms/puzzleRoomLayout';

const SEARCHED_ROOMS = 8;

export function checkRoomsHoldYouUntilSolved(check: CheckReporter): void {
  checkFurnishedRoomsStartShut(check);
  checkAShutDoorLetsYouInButNotOut(check);
  checkPullingEveryLeverOpensTheRoom(check);
  checkAJumpCannotVaultAShutDoor(check);
}

function checkFurnishedRoomsStartShut(check: CheckReporter): void {
  const puzzles = labyrinthPuzzles();
  const doors = everyDoorWorthWorking(puzzles);
  const open = doors.filter(({ layout, gate }) => puzzles.gateIsOpen(layout, gate));
  check(
    'a doorway of an unsolved chamber stands open only where the chamber across it has nothing to work',
    doors.length > 100 &&
      open.every(({ layout, gate }) => !hasSomethingToDo(roomBeyond(puzzles, layout, gate))),
  );
}

function checkAShutDoorLetsYouInButNotOut(check: CheckReporter): void {
  const puzzles = labyrinthPuzzles();
  const rules = stepRulesOf(puzzles);
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
  const puzzles = labyrinthPuzzles();
  const layout = everyRoom(puzzles).find(
    (candidate) => candidate.kindName === 'lever' && candidate.opensWhen.length > 0,
  )!;
  const shutBefore = everyGateOf(layout).every((gate) => !puzzles.gateIsOpen(layout, gate));
  for (const lever of layout.fixtures.filter((fixture) => fixture.kind === 'lever')) {
    puzzles.use(lever.x, lever.y);
  }
  const rules = stepRulesOf(puzzles);
  const openAfter = everyGateOf(layout).every(
    (gate) => puzzles.gateIsOpen(layout, gate) && stepThrough(rules, layout, gate, 'out'),
  );
  check(
    'pulling every lever in a lever chamber opens its doorways and lets the walker back out',
    shutBefore && openAfter,
  );
}

function checkAJumpCannotVaultAShutDoor(check: CheckReporter): void {
  const puzzles = labyrinthPuzzles();
  const rules = stepRulesOf(puzzles);
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

function stepRulesOf(puzzles: PuzzleWorld): StepRules {
  return {
    isWalkableAt: (x, y) => !puzzles.blocksTheWayInAt(x, y),
    clearTheWay: (x, y, dx, dy, mayPush) => puzzles.clearTheWay(x, y, dx, dy, mayPush),
  };
}

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

function labyrinthPuzzles(): PuzzleWorld {
  const store = new PipelineStore(sanitizePipeline(infiniteLabyrinth().state));
  return new PuzzleWorld(store, () => true, undefined, new ItemAssets(defaultItems()));
}

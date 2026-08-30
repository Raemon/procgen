import { defaultItems } from '@/features/asset-library/items/defaultItems';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import type { DoorwaySide } from '@/features/asset-library/worlds/labyrinth/roomLayout';
import {
  LABYRINTH_CELL_SIZE,
  labyrinthCellOrigin,
} from '@/features/asset-library/worlds/labyrinth/labyrinthLattice';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { mulberry32 } from '@/features/asset-library/worlds/random/mulberry32';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { infiniteLabyrinth } from '@/features/asset-library/worlds/seeds/infiniteLabyrinth';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { gateLook } from '../fixtures/fixtureAppearance';
import type { PuzzleFixture } from '../fixtures/puzzleFixture';
import type { KeyPurse } from '../interaction/keyPurse';
import { allPuzzleKinds } from '../kinds/puzzleKind';
import { RoomCells } from '../kinds/roomCells';
import { PuzzleWorld } from '../puzzleWorld';
import { everyGateOf, sideOfGate, type PuzzleRoomLayout } from '../rooms/puzzleRoomLayout';

const SEARCHED_ROOMS = 12;

export function checkKeyRoomsAndDoors(check: CheckReporter): void {
  checkKeysLieOnTheFloor(check);
  checkTakingAKeyClearsItFromTheFloor(check);
  checkAKeyholeDoorRefusesAnEmptyBag(check);
  checkOneKeyOpensOneDoorway(check);
  checkTheFacingDoorOpensToo(check);
  checkResettingARoomRelocksAndRestocksIt(check);
  checkABarredDoorRefusesAKey(check);
  checkAKeyRoomWithNoRoomForKeysStandsOpen(check);
  checkTheTwoLocksLookDifferent(check);
}

function checkKeysLieOnTheFloor(check: CheckReporter): void {
  const found = aKeyRoom();
  const spawns = found.puzzles.itemSpawnsIn(...boundsOf(found.layout));
  check(
    'a key room lays its keys out as ground item spawns and lists none of them as door signals',
    found.layout.items.length > 0 &&
      spawns.length === found.layout.items.length &&
      found.layout.opensWhen.length === 0,
  );
}

function checkTakingAKeyClearsItFromTheFloor(check: CheckReporter): void {
  const found = aKeyRoom();
  const spawn = found.puzzles.itemSpawnsIn(...boundsOf(found.layout))[0]!;
  const owned = found.puzzles.takeSpawn(spawn);
  const left = found.puzzles.itemSpawnsIn(...boundsOf(found.layout));
  check(
    'taking a key hands it to the picker-up and clears it from the floor of that room',
    owned && left.length === found.layout.items.length - 1,
  );
}

function checkAKeyholeDoorRefusesAnEmptyBag(check: CheckReporter): void {
  const found = aKeyRoom();
  const gate = everyGateOf(found.layout)[0]!;
  const outcome = found.puzzles.use(gate.x, gate.y, emptyBag());
  check(
    'a keyhole door turned with an empty bag reports no_key and stays shut',
    !outcome.ok && outcome.code === 'no_key' && !found.puzzles.gateIsOpen(found.layout, gate),
  );
}

function checkOneKeyOpensOneDoorway(check: CheckReporter): void {
  const found = aKeyRoomWithTwoLockedDoorways();
  const shut = lockedGatesBySide(found);
  const opened = shut[0]!;
  const elsewhere = shut[1]!;
  const bag = bagHolding(2);
  const outcome = found.puzzles.use(opened.x, opened.y, bag);
  check(
    'spending one key opens the doorway it was turned in and leaves the rest of the room locked',
    outcome.ok &&
      found.puzzles.gateIsOpen(found.layout, opened) &&
      !found.puzzles.gateIsOpen(found.layout, elsewhere) &&
      bag.left() === 1,
  );
}

function checkTheFacingDoorOpensToo(check: CheckReporter): void {
  const found = aKeyRoom();
  const gate = everyGateOf(found.layout)[0]!;
  found.puzzles.use(gate.x, gate.y, bagHolding(1));
  const beyond = beyondTheGate(found.puzzles, found.layout, gate);
  check(
    'the door facing an unlocked keyhole door reads open too, so the passage can be walked',
    beyond !== null && found.puzzles.gateIsOpen(beyond.layout, beyond.gate),
  );
}

function checkResettingARoomRelocksAndRestocksIt(check: CheckReporter): void {
  const found = aKeyRoom();
  const spawn = found.puzzles.itemSpawnsIn(...boundsOf(found.layout))[0]!;
  const gate = everyGateOf(found.layout)[0]!;
  found.puzzles.takeSpawn(spawn);
  found.puzzles.use(gate.x, gate.y, bagHolding(1));
  found.puzzles.resetRoomAt(found.layout.interior.x, found.layout.interior.y);
  check(
    'resetting a key room locks its doors again and lays every key back on its floor',
    !found.puzzles.gateIsOpen(found.layout, gate) &&
      found.puzzles.itemSpawnsIn(...boundsOf(found.layout)).length === found.layout.items.length,
  );
}

function checkABarredDoorRefusesAKey(check: CheckReporter): void {
  const found = aRoomWhere((layout) => layout.unlock === 'signals' && layout.opensWhen.length > 0);
  const gate = everyGateOf(found.layout)[0]!;
  const bag = bagHolding(3);
  const outcome = found.puzzles.use(gate.x, gate.y, bag);
  check(
    'a barred door takes no key however many the bag holds, since its room is opened another way',
    !outcome.ok && outcome.code === 'door_is_locked' && bag.left() === 3,
  );
}

function checkAKeyRoomWithNoRoomForKeysStandsOpen(check: CheckReporter): void {
  const kind = allPuzzleKinds().find((candidate) => candidate.name === 'key')!;
  const furnished = kind.furnish({
    cells: new RoomCells({ x: 0, y: 0, width: 0, height: 0 }),
    level: 0,
    entrances: [{ x: 0, y: 0 }],
    rng: mulberry32(1),
  });
  check(
    'a key room too small to hold a key falls back to open doors rather than sealing the player in',
    (furnished.items ?? []).length === 0 &&
      furnished.unlock !== 'key' &&
      furnished.opensWhen.length === 0,
  );
}

function checkTheTwoLocksLookDifferent(check: CheckReporter): void {
  const keyhole = gateLook('key', false);
  const barred = gateLook('mechanism', false);
  check(
    'a keyhole door and a barred door are painted and described differently while both stand shut',
    keyhole.faceArt !== barred.faceArt &&
      keyhole.tag !== barred.tag &&
      keyhole.color !== barred.color,
  );
}

interface FoundRoom {
  puzzles: PuzzleWorld;
  layout: PuzzleRoomLayout;
}

function aKeyRoom(): FoundRoom {
  return aRoomWhere((layout) => layout.unlock === 'key' && layout.items.length > 0);
}

function aKeyRoomWithTwoLockedDoorways(): FoundRoom {
  return aRoomWhere(
    (layout, puzzles) =>
      layout.unlock === 'key' && lockedGatesBySide({ layout, puzzles }).length > 1,
  );
}

function lockedGatesBySide(found: FoundRoom): PuzzleFixture[] {
  const oneEach = new Map<DoorwaySide, PuzzleFixture>();
  for (const gate of everyGateOf(found.layout)) {
    if (found.puzzles.gateIsOpen(found.layout, gate)) continue;
    const side = sideOfGate(found.layout, gate);
    if (!oneEach.has(side)) oneEach.set(side, gate);
  }
  return [...oneEach.values()];
}

function aRoomWhere(wanted: (layout: PuzzleRoomLayout, puzzles: PuzzleWorld) => boolean): FoundRoom {
  const puzzles = labyrinthPuzzles();
  for (let roomY = -SEARCHED_ROOMS; roomY <= SEARCHED_ROOMS; roomY++) {
    for (let roomX = -SEARCHED_ROOMS; roomX <= SEARCHED_ROOMS; roomX++) {
      const layout = puzzles.roomAt(middleOfRoom(roomX), middleOfRoom(roomY));
      if (layout && everyGateOf(layout).length > 0 && wanted(layout, puzzles)) {
        return { puzzles, layout };
      }
    }
  }
  throw new Error('no room in the searched rings matched');
}

function middleOfRoom(cell: number): number {
  return labyrinthCellOrigin(cell) + Math.floor(LABYRINTH_CELL_SIZE / 2);
}

function labyrinthPuzzles(): PuzzleWorld {
  const store = new PipelineStore(sanitizePipeline(infiniteLabyrinth().state));
  return new PuzzleWorld(store, () => true, undefined, new ItemAssets(defaultItems()));
}

function boundsOf(layout: PuzzleRoomLayout): [number, number, number, number] {
  const { x, y, width, height } = layout.interior;
  return [x, y, x + width - 1, y + height - 1];
}

function beyondTheGate(
  puzzles: PuzzleWorld,
  layout: PuzzleRoomLayout,
  gate: PuzzleFixture,
): { layout: PuzzleRoomLayout; gate: PuzzleFixture } | null {
  const side = sideOfGate(layout, gate);
  const step = STEPS_BEYOND[side];
  const neighbour = puzzles.roomAt(gate.x + step[0], gate.y + step[1]);
  if (!neighbour) return null;
  const facing = everyGateOf(neighbour).find(
    (candidate) => sideOfGate(neighbour, candidate) === FACING[side],
  );
  return facing ? { layout: neighbour, gate: facing } : null;
}

const STEPS_BEYOND: Record<DoorwaySide, [number, number]> = {
  east: [1, 0],
  west: [-1, 0],
  north: [0, -1],
  south: [0, 1],
};

const FACING: Record<DoorwaySide, DoorwaySide> = {
  east: 'west',
  west: 'east',
  north: 'south',
  south: 'north',
};

function emptyBag(): KeyPurse {
  return { spendKey: () => false };
}

function bagHolding(count: number): KeyPurse & { left(): number } {
  let held = count;
  return {
    spendKey: () => {
      if (held <= 0) return false;
      held--;
      return true;
    },
    left: () => held,
  };
}

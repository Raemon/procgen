import { cellKey } from '../world/cellPoint';
import { reachableCellsFrom } from '../world/spawn/reachableCellsFrom';
import {
  ROOM_TO_MOVE_AROUND,
  spotIsRoomyEnoughToSpawnIn,
  spotIsTooPennedInToStandIn,
} from '../world/spawn/spawnRoominess';
import { spawnWithRoomToMove } from '../world/spawn/spawnWithRoomToMove';
import { World } from '../world/world';
import type { CheckReporter } from './checkReporter';

const ORIGIN = { x: 0, y: 0 };

function pocketAtOriginAndFieldFarAway(): (x: number, y: number) => boolean {
  return (x, y) => (x === 0 && y === 0) || (x >= 20 && x < 40 && y >= 20 && y < 40);
}

function oneWideCorridorThroughOrigin(): (x: number, y: number) => boolean {
  return (x, y) => y === 0 && x >= 0 && x < ROOM_TO_MOVE_AROUND.cellsAFreshSpawnNeeds * 2;
}

function roomWithADoorwayNearOrigin(): (x: number, y: number) => boolean {
  const inTheRoom = (x: number, y: number) => x >= 3 && x < 23 && y >= -10 && y < 10;
  const inTheDoorway = (x: number, y: number) => y === 0 && x >= 0 && x < 3;
  return (x, y) => inTheRoom(x, y) || inTheDoorway(x, y);
}

export function checkPlayerSpawnHasRoomToMove(check: CheckReporter): void {
  const pocketWorld = pocketAtOriginAndFieldFarAway();
  const spawnedInField = spawnWithRoomToMove(pocketWorld, ORIGIN, 64);
  check(
    'a spawn skips the walkable pocket it starts in and lands in open ground',
    spawnedInField !== null && spawnedInField.x >= 20 && spawnedInField.y >= 20,
  );
  check(
    'the spawn can move around in the space the roominess bar asks for',
    spawnedInField !== null && spotIsRoomyEnoughToSpawnIn(pocketWorld, spawnedInField),
  );

  const doorwayWorld = roomWithADoorwayNearOrigin();
  const spawnedOffTheDoorway = spawnWithRoomToMove(doorwayWorld, ORIGIN, 64);
  check(
    'a spawn passes over a one-tile doorway for a spot with elbow room',
    spawnedOffTheDoorway !== null && spawnedOffTheDoorway.x >= 4,
  );

  const corridorWorld = oneWideCorridorThroughOrigin();
  const spawnedInCorridor = spawnWithRoomToMove(corridorWorld, ORIGIN, 64);
  check(
    'a world with no elbow room anywhere still spawns on walkable ground',
    spawnedInCorridor !== null && corridorWorld(spawnedInCorridor.x, spawnedInCorridor.y),
  );

  check(
    'a world with nowhere to stand has no spawn',
    spawnWithRoomToMove(() => false, ORIGIN, 8) === null,
  );

  const cramped = new World(pocketWorld);
  cramped.ensurePlayerHasRoomToMove();
  check(
    'regenerating a world moves the player out of a pocket they cannot move in',
    spotIsRoomyEnoughToSpawnIn(pocketWorld, { x: cramped.playerX, y: cramped.playerY }),
  );

  const walledIn = new World(() => false);
  walledIn.ensurePlayerHasRoomToMove();
  check('a player with nowhere to go stays put', walledIn.playerX === 0 && walledIn.playerY === 0);

  const alreadyRoomy = new World(doorwayWorld);
  alreadyRoomy.snapTo(10, 5, 0);
  alreadyRoomy.ensurePlayerHasRoomToMove();
  check(
    'a player already standing in open ground is left where they are',
    alreadyRoomy.playerX === 10 && alreadyRoomy.playerY === 5,
  );

  const smallRoom = (x: number, y: number) => x >= 0 && x < 4 && y >= 0 && y < 4;
  const standingInASmallRoom = new World(smallRoom);
  standingInASmallRoom.snapTo(1, 1, 0);
  standingInASmallRoom.ensurePlayerHasRoomToMove();
  check(
    'a room too small to spawn into is still room enough to be left standing in',
    !spotIsRoomyEnoughToSpawnIn(smallRoom, { x: 1, y: 1 }) &&
      !spotIsTooPennedInToStandIn(smallRoom, { x: 1, y: 1 }) &&
      standingInASmallRoom.playerX === 1 &&
      standingInASmallRoom.playerY === 1,
  );

  const cappedFlood = reachableCellsFrom(() => true, ORIGIN, 25);
  check('a flood fill stops once it has counted the space it was asked for', cappedFlood.size === 25);
  check('a flood fill counts the cell it started on', cappedFlood.has(cellKey(0, 0)));
}

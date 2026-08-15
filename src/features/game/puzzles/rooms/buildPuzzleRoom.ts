import '../kinds';
import { labyrinthCellKey } from '@/features/asset-library/worlds/labyrinth/labyrinthLattice';
import { chunkExitsOf } from '@/features/asset-library/worlds/labyrinth/chunkExits';
import { roleOf, ROOM } from '@/features/asset-library/worlds/labyrinth/chunkRole';
import type { LabyrinthKnobs } from '@/features/asset-library/worlds/labyrinth/labyrinthKnobs';
import { rectBottom, rectRight, roomGeometryOf, type RoomDoorway, type RoomGeometry, type RoomRect } from '@/features/asset-library/worlds/labyrinth/roomLayout';
import { hashString } from '@/features/asset-library/worlds/random/hashString';
import { mulberry32 } from '@/features/asset-library/worlds/random/mulberry32';
import { fixture, type PuzzleFixture } from '../fixtures/puzzleFixture';
import { nothingToSolve, type FurnishedRoom } from '../kinds/puzzleKind';
import { RoomCells, type Cell } from '../kinds/roomCells';
import { challengeForRing, roomRing, type RoomChallenge } from './roomDifficulty';
import type { PuzzleRoomLayout, RoomGates } from './puzzleRoomLayout';

export function buildPuzzleRoom(
  knobs: LabyrinthKnobs,
  roomX: number,
  roomY: number,
): PuzzleRoomLayout {
  const geometry = roomGeometryOf(roomX, roomY, chunkExitsOf(roomX, roomY, knobs), knobs);
  const isRoom = roleOf(roomX, roomY, knobs) === ROOM;
  const challenge = challengeOf(knobs, roomX, roomY, isRoom);
  const furnished = furnish(knobs, roomX, roomY, geometry, challenge);
  return {
    roomX,
    roomY,
    key: labyrinthCellKey(roomX, roomY),
    interior: geometry.interior,
    kindName: challenge.kind?.name ?? '',
    level: challenge.level,
    entrance: entrancesOf(geometry)[0]!,
    fixtures: furnished.fixtures,
    gates: isRoom ? gatesOf(geometry) : { east: [], south: [], west: [], north: [] },
    opensWhen: furnished.opensWhen,
    solution: furnished.solution,
  };
}

function challengeOf(
  knobs: LabyrinthKnobs,
  roomX: number,
  roomY: number,
  isRoom: boolean,
): RoomChallenge {
  if (!isRoom) return { kind: null, level: 0 };
  const ring = roomRing(roomX, roomY);
  return challengeForRing(ring, knobs.tutorialRings, roomStream(knobs, roomX, roomY, 'kind'));
}

function furnish(
  knobs: LabyrinthKnobs,
  roomX: number,
  roomY: number,
  geometry: RoomGeometry,
  challenge: RoomChallenge,
): FurnishedRoom {
  if (!challenge.kind) return nothingToSolve();
  return challenge.kind.furnish({
    cells: new RoomCells(geometry.interior),
    level: challenge.level,
    entrances: entrancesOf(geometry),
    rng: roomStream(knobs, roomX, roomY, 'furnish'),
  });
}

function entrancesOf(geometry: RoomGeometry): Cell[] {
  const inner = geometry.doorways.map((doorway) => firstInteriorCell(doorway, geometry.interior));
  if (inner.length > 0) return inner;
  return [{ x: geometry.interior.x, y: geometry.interior.y + Math.floor(geometry.interior.height / 2) }];
}

function firstInteriorCell(doorway: RoomDoorway, interior: RoomRect): Cell {
  const along = doorway.gate[Math.floor(doorway.gate.length / 2)]!;
  if (doorway.side === 'west') return { x: interior.x, y: along.y };
  if (doorway.side === 'east') return { x: rectRight(interior), y: along.y };
  if (doorway.side === 'north') return { x: along.x, y: interior.y };
  return { x: along.x, y: rectBottom(interior) };
}

function gatesOf(geometry: RoomGeometry): RoomGates {
  return {
    east: gateFixtures(geometry, 'east'),
    south: gateFixtures(geometry, 'south'),
    west: gateFixtures(geometry, 'west'),
    north: gateFixtures(geometry, 'north'),
  };
}

function gateFixtures(geometry: RoomGeometry, side: RoomDoorway['side']): PuzzleFixture[] {
  const doorway = geometry.doorways.find((candidate) => candidate.side === side);
  if (!doorway) return [];
  const name = `gate${side[0]!.toUpperCase()}${side.slice(1)}`;
  return doorway.gate.map((cell, index) => fixture(`${name}${index}`, 'gate', cell));
}

function roomStream(knobs: LabyrinthKnobs, roomX: number, roomY: number, label: string) {
  return mulberry32(hashString(`${knobs.seed}:puzzleRoom:${roomX},${roomY}:${label}`));
}

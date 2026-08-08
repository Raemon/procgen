import type { KnobParamSpec, ParamValue } from '../../nodeType';
import { CARVER_CHOICES, CARVER_DFS } from '../maze/mazeCarvers';

export const PUZZLE_ROOMS_NODE_TYPE = 'puzzleRooms';

export const PUZZLE_LATTICE_LABEL = 'lattice';

export interface PuzzleRoomKnobs {
  seed: number;
  roomTiles: number;
  roomChunks: number;
  regionRooms: number;
  carver: number;
  braid: number;
  doorsPerEdge: number;
  wall: number;
  corridor: number;
  fillBetween: number;
  floorTile: number;
  wallTile: number;
}

export const PUZZLE_ROOM_PARAMS: Record<keyof Omit<PuzzleRoomKnobs, 'seed'>, KnobParamSpec> = {
  roomTiles: {
    kind: 'int',
    label: 'room size',
    help: 'Side length of each puzzle chamber in tiles, before its wall ring. Small rooms read at a glance; big ones give sokoban crates room to go wrong.',
    min: 5,
    max: 29,
    default: 13,
  },
  roomChunks: {
    kind: 'int',
    label: 'chunks per room',
    help: 'Side length, in 32-tile chunks, of the block each chamber sits in. Raise it to space the chambers further apart and lengthen the corridors between them.',
    min: 1,
    max: 4,
    default: 1,
  },
  regionRooms: {
    kind: 'int',
    label: 'rooms per maze',
    help: 'Side length, in chambers, of each self-contained maze of chambers. The corridors inside one are carved as a maze over the chambers, so most neighbours are not joined at all and the labyrinth has dead ends; neighbouring mazes meet through border corridors.',
    min: 2,
    max: 12,
    default: 5,
  },
  carver: {
    kind: 'choice',
    label: 'carver',
    help: 'The algorithm that decides which chambers are joined; each gives the labyrinth a distinct shape.',
    options: CARVER_CHOICES,
    default: CARVER_DFS,
  },
  braid: {
    kind: 'number',
    label: 'braid',
    help: 'Fraction of dead-end chambers given a second corridor. 0 leaves a perfect maze where every chamber has exactly one way in; higher values add loops, so a chamber you cannot solve need not end the run.',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.25,
  },
  doorsPerEdge: {
    kind: 'int',
    label: 'corridors per border',
    help: 'Corridors punched through each border between neighbouring mazes of chambers, so the labyrinth carries on rather than sealing itself into blocks.',
    min: 1,
    max: 4,
    default: 1,
  },
  wall: {
    kind: 'int',
    label: 'wall thickness',
    help: 'Thickness of the ring around each chamber and the lining along each corridor, in tiles.',
    min: 1,
    max: 4,
    default: 1,
  },
  corridor: {
    kind: 'choice',
    label: 'corridor width',
    help: 'Width of the corridors joining neighbouring chambers, and therefore how wide each locked doorway is. Corridors are centred on the doorway, so only odd widths exist.',
    options: [
      { value: 1, label: '1 tile', help: 'Single file: a crate or a closed door fills the whole doorway.' },
      { value: 3, label: '3 tiles', help: 'Room to walk two abreast, and a doorway three doors wide.' },
      { value: 5, label: '5 tiles', help: 'A hall rather than a corridor.' },
      { value: 7, label: '7 tiles', help: 'As wide as a small chamber; the doors read as a gatehouse.' },
    ],
    default: 1,
  },
  fillBetween: {
    kind: 'toggle',
    label: 'solid between rooms',
    help: 'On, everything outside the chambers and corridors is filled with the wall tile, so the doors are the only way through. Off, the space between is left empty for a labyrinth layer underneath to show through — the doors still gate their own chambers, but the world around them opens up.',
    default: 1,
  },
  floorTile: {
    kind: 'tile',
    label: 'floor',
    help: 'Tile painted inside the chambers, along the corridors, and under each doorway.',
  },
  wallTile: {
    kind: 'tile',
    label: 'wall',
    help: 'Tile painted on the chamber rings, the corridor lining, and the fill between rooms.',
  },
};

export function puzzleRoomKnobsFrom(
  seed: number,
  params: Record<string, ParamValue>,
): PuzzleRoomKnobs {
  return {
    seed,
    roomTiles: params.roomTiles as number,
    roomChunks: params.roomChunks as number,
    regionRooms: params.regionRooms as number,
    carver: params.carver as number,
    braid: params.braid as number,
    doorsPerEdge: params.doorsPerEdge as number,
    wall: params.wall as number,
    corridor: params.corridor as number,
    fillBetween: params.fillBetween as number,
    floorTile: params.floorTile as number,
    wallTile: params.wallTile as number,
  };
}

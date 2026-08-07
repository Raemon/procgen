import type { KnobParamSpec, ParamValue } from '../../nodeType';

export const PUZZLE_ROOMS_NODE_TYPE = 'puzzleRooms';

export interface PuzzleRoomKnobs {
  seed: number;
  roomTiles: number;
  roomChunks: number;
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
  wall: {
    kind: 'int',
    label: 'wall thickness',
    help: 'Thickness of the ring around each chamber and the lining along each corridor, in tiles.',
    min: 1,
    max: 4,
    default: 1,
  },
  corridor: {
    kind: 'int',
    label: 'corridor width',
    help: 'Width of the corridors joining neighbouring chambers, and therefore how wide each locked doorway is.',
    min: 1,
    max: 7,
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
    wall: params.wall as number,
    corridor: params.corridor as number,
    fillBetween: params.fillBetween as number,
    floorTile: params.floorTile as number,
    wallTile: params.wallTile as number,
  };
}

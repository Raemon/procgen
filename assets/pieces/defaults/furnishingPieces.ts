import { defaultTileId } from '../../tiles/defaultTiles';
import { paintVoxel } from '../piecePainting';
import { paintColumn, paintLayerAcross, type PieceBlueprint } from './pieceBlueprint';

export const FURNISHING_PIECE_NAMES = {
  forge: 'smithy forge and anvil',
  bench: 'oak bench',
  lanternPost: 'lantern post',
  firewood: 'stacked firewood',
  gardenBed: 'flowering garden bed',
  well: 'stone village well',
  marketStall: 'awninged market stall',
};

export function furnishingPieceBlueprints(): PieceBlueprint[] {
  return [
    forgeBlueprint(),
    benchBlueprint(),
    lanternPostBlueprint(),
    firewoodBlueprint(),
    gardenBedBlueprint(),
    wellBlueprint(),
    marketStallBlueprint(),
  ];
}

function forgeBlueprint(): PieceBlueprint {
  return {
    name: FURNISHING_PIECE_NAMES.forge,
    role: 'furnishing',
    width: 2,
    depth: 2,
    layers: 3,
    paint: (piece) => {
      paintLayerAcross(piece, 0, defaultTileId('gravel yard'));
      paintVoxel(piece, 0, 0, 1, defaultTileId('forge coals'));
      paintVoxel(piece, 1, 0, 1, defaultTileId('anvil block'));
      paintVoxel(piece, 1, 1, 1, defaultTileId('firewood stack'));
      paintColumn(piece, 0, 1, [defaultTileId('gravel yard'), defaultTileId('granite chimney'), defaultTileId('granite chimney')]);
    },
  };
}

function benchBlueprint(): PieceBlueprint {
  return {
    name: FURNISHING_PIECE_NAMES.bench,
    role: 'furnishing',
    width: 1,
    depth: 1,
    layers: 2,
    paint: (piece) => paintColumn(piece, 0, 0, [defaultTileId('gravel yard'), defaultTileId('oak bench')]),
  };
}

function lanternPostBlueprint(): PieceBlueprint {
  return {
    name: FURNISHING_PIECE_NAMES.lanternPost,
    role: 'furnishing',
    width: 1,
    depth: 1,
    layers: 3,
    paint: (piece) =>
      paintColumn(piece, 0, 0, [
        defaultTileId('gravel yard'),
        defaultTileId('oak beam'),
        defaultTileId('lantern post'),
      ]),
  };
}

function firewoodBlueprint(): PieceBlueprint {
  return {
    name: FURNISHING_PIECE_NAMES.firewood,
    role: 'furnishing',
    width: 2,
    depth: 1,
    layers: 3,
    paint: (piece) => {
      paintLayerAcross(piece, 0, defaultTileId('gravel yard'));
      paintLayerAcross(piece, 1, defaultTileId('firewood stack'));
      paintVoxel(piece, 0, 0, 2, defaultTileId('firewood stack'));
    },
  };
}

function gardenBedBlueprint(): PieceBlueprint {
  return {
    name: FURNISHING_PIECE_NAMES.gardenBed,
    role: 'furnishing',
    width: 2,
    depth: 2,
    layers: 2,
    paint: (piece) => {
      paintLayerAcross(piece, 0, defaultTileId('garden loam'));
      paintVoxel(piece, 1, 0, 1, defaultTileId('meadow flowers'));
      paintVoxel(piece, 0, 1, 1, defaultTileId('meadow flowers'));
    },
  };
}

function wellBlueprint(): PieceBlueprint {
  return {
    name: FURNISHING_PIECE_NAMES.well,
    role: 'furnishing',
    width: 2,
    depth: 2,
    layers: 3,
    paint: (piece) => {
      paintLayerAcross(piece, 0, defaultTileId('flagstone plaza'));
      paintLayerAcross(piece, 1, defaultTileId('well ring'));
      paintVoxel(piece, 0, 0, 2, defaultTileId('oak beam'));
      paintVoxel(piece, 1, 1, 2, defaultTileId('oak beam'));
    },
  };
}

function marketStallBlueprint(): PieceBlueprint {
  return {
    name: FURNISHING_PIECE_NAMES.marketStall,
    role: 'furnishing',
    width: 3,
    depth: 3,
    layers: 3,
    paint: (piece) => {
      paintLayerAcross(piece, 0, defaultTileId('gravel yard'));
      for (const [x, y] of CORNERS) paintVoxel(piece, x, y, 1, defaultTileId('oak beam'));
      paintLayerAcross(piece, 2, defaultTileId('market awning'));
    },
  };
}

const CORNERS: readonly (readonly [number, number])[] = [
  [0, 0],
  [2, 0],
  [0, 2],
  [2, 2],
];

import { paintColumn, type PieceBlueprint } from './pieceBlueprint';

export interface CulturePieceNames {
  wallRun: string;
  cornerPost: string;
  windowedWall: string;
  doorway: string;
  roofEave: string;
  roofRidge: string;
  gableEnd: string;
  floorSlab: string;
  chimney: string;
}

export interface CulturePieceTiles {
  footing: number;
  wall: number;
  frame: number;
  door: number;
  window: number;
  roofSlope: number;
  roofRidge: number;
  floor: number;
  chimney: number;
  chimneyCap: number;
}

export function culturePieceBlueprints(
  names: CulturePieceNames,
  tiles: CulturePieceTiles,
): PieceBlueprint[] {
  return [
    wallRunOf(names, tiles),
    cornerPostOf(names, tiles),
    windowedWallOf(names, tiles),
    doorwayOf(names, tiles),
    roofEaveOf(names, tiles),
    roofRidgeOf(names, tiles),
    gableEndOf(names, tiles),
    floorSlabOf(names, tiles),
    chimneyOf(names, tiles),
  ];
}

function wallRunOf(names: CulturePieceNames, tiles: CulturePieceTiles): PieceBlueprint {
  return {
    name: names.wallRun,
    role: 'wallSegment',
    width: 1,
    depth: 1,
    layers: 3,
    paint: (piece) => paintColumn(piece, 0, 0, [tiles.footing, tiles.wall, tiles.wall]),
  };
}

function cornerPostOf(names: CulturePieceNames, tiles: CulturePieceTiles): PieceBlueprint {
  return {
    name: names.cornerPost,
    role: 'wallCorner',
    width: 1,
    depth: 1,
    layers: 3,
    paint: (piece) => paintColumn(piece, 0, 0, [tiles.wall, tiles.wall, tiles.wall]),
  };
}

function windowedWallOf(names: CulturePieceNames, tiles: CulturePieceTiles): PieceBlueprint {
  return {
    name: names.windowedWall,
    role: 'window',
    width: 1,
    depth: 1,
    layers: 3,
    paint: (piece) => paintColumn(piece, 0, 0, [tiles.footing, tiles.window, tiles.wall]),
  };
}

function doorwayOf(names: CulturePieceNames, tiles: CulturePieceTiles): PieceBlueprint {
  return {
    name: names.doorway,
    role: 'door',
    width: 1,
    depth: 1,
    layers: 3,
    paint: (piece) => paintColumn(piece, 0, 0, [tiles.door, tiles.door, tiles.frame]),
  };
}

function roofEaveOf(names: CulturePieceNames, tiles: CulturePieceTiles): PieceBlueprint {
  return {
    name: names.roofEave,
    role: 'roofEdge',
    width: 1,
    depth: 1,
    layers: 1,
    paint: (piece) => paintColumn(piece, 0, 0, [tiles.roofSlope]),
  };
}

function roofRidgeOf(names: CulturePieceNames, tiles: CulturePieceTiles): PieceBlueprint {
  return {
    name: names.roofRidge,
    role: 'roofRidge',
    width: 1,
    depth: 1,
    layers: 1,
    paint: (piece) => paintColumn(piece, 0, 0, [tiles.roofRidge]),
  };
}

function gableEndOf(names: CulturePieceNames, tiles: CulturePieceTiles): PieceBlueprint {
  return {
    name: names.gableEnd,
    role: 'roofGableEnd',
    width: 1,
    depth: 1,
    layers: 2,
    paint: (piece) => paintColumn(piece, 0, 0, [tiles.wall, tiles.roofSlope]),
  };
}

function floorSlabOf(names: CulturePieceNames, tiles: CulturePieceTiles): PieceBlueprint {
  return {
    name: names.floorSlab,
    role: 'floor',
    width: 1,
    depth: 1,
    layers: 1,
    paint: (piece) => paintColumn(piece, 0, 0, [tiles.floor]),
  };
}

function chimneyOf(names: CulturePieceNames, tiles: CulturePieceTiles): PieceBlueprint {
  return {
    name: names.chimney,
    role: 'chimney',
    width: 1,
    depth: 1,
    layers: 3,
    paint: (piece) => paintColumn(piece, 0, 0, [tiles.chimney, tiles.chimney, tiles.chimneyCap]),
  };
}

import { assetId, type TileId } from '@/features/asset-library/asset';
import type { TileIdBySlot } from './tileIdBySlot';
import {
  culturePieceBlueprints,
  type CulturePieceNames,
  type CulturePieceTiles,
} from '../pieces/defaults/culturePieceSet';
import { pieceFromBlueprint } from '../pieces/defaults/pieceBlueprint';
import type { Piece } from '../pieces/pieceDef';
import { intBetween, kitStream, pickOne } from './kitRandom';

const PIECE_NOUNS: CulturePieceNames = {
  wallRun: 'wall run',
  cornerPost: 'corner post',
  windowedWall: 'windowed wall',
  doorway: 'doorway',
  roofEave: 'roof eave',
  roofRidge: 'roof ridge',
  gableEnd: 'gable end',
  floorSlab: 'floor slab',
  chimney: 'chimney stack',
};

const SHORTEST_CHIMNEY = 2;
const TALLEST_CHIMNEY = 3;
const CHIMNEY_CAP_SLOTS: readonly string[] = ['footing', 'floor', 'beam'];

export function generateKitPieces(
  seed: number,
  kitName: string,
  idBySlot: TileIdBySlot,
  firstId: number,
): Piece[] {
  const random = kitStream(seed, 'pieces');
  const variation = { chimneyLayers: intBetween(random, SHORTEST_CHIMNEY, TALLEST_CHIMNEY) };
  const tiles = pieceTilesOf(idBySlot, pickOne(random, CHIMNEY_CAP_SLOTS));
  return culturePieceBlueprints(pieceNamesPrefixedWith(kitName), tiles, variation).map(
    (blueprint, index) => pieceFromBlueprint(blueprint, assetId<'pieces'>(firstId + index)),
  );
}

function pieceNamesPrefixedWith(kitName: string): CulturePieceNames {
  const prefixed = Object.entries(PIECE_NOUNS).map(([key, noun]) => [key, `${kitName} ${noun}`]);
  return Object.fromEntries(prefixed) as CulturePieceNames;
}

function pieceTilesOf(
  idBySlot: TileIdBySlot,
  chimneyCapSlot: string,
): CulturePieceTiles {
  const tileOf = (key: string): TileId => idBySlot.get(key) as TileId;
  return {
    footing: tileOf('footing'),
    wall: tileOf('wall'),
    frame: tileOf('beam'),
    door: tileOf('door'),
    window: tileOf('window'),
    roofSlope: tileOf('roofSlope'),
    roofRidge: tileOf('roofRidge'),
    floor: tileOf('floor'),
    chimney: tileOf('chimney'),
    chimneyCap: tileOf(chimneyCapSlot),
  };
}

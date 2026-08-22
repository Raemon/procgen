import type { TileId } from '@/features/asset-library/asset';
import type { TileIdBySlot } from './tileIdBySlot';
import type { CultureId } from '@/features/asset-library/asset';
import { GABLE_ROOF, HIP_ROOF, type Culture, type PieceRoleBindings } from '../cultures/cultureDef';
import type { Piece } from '../pieces/pieceDef';
import { intBetween, kitStream, pickOne } from './kitRandom';

const FEWEST_STORY_LAYERS = 2;
const MOST_STORY_LAYERS = 3;
const CLOSEST_WINDOWS = 3;
const SPARSEST_WINDOWS = 5;

export function generateKitCulture(
  seed: number,
  name: string,
  idBySlot: TileIdBySlot,
  pieces: readonly Piece[],
  id: CultureId,
): Culture {
  const random = kitStream(seed, 'culture');
  return {
    id,
    name,
    roleBindings: roleBindingsOfPieces(pieces),
    ...cultureTileIds(idBySlot),
    roofStyle: pickOne(random, [GABLE_ROOF, HIP_ROOF]),
    storyLayers: intBetween(random, FEWEST_STORY_LAYERS, MOST_STORY_LAYERS),
    windowEvery: intBetween(random, CLOSEST_WINDOWS, SPARSEST_WINDOWS),
  };
}

function cultureTileIds(idBySlot: TileIdBySlot) {
  const tileOf = (key: string): TileId => idBySlot.get(key) as TileId;
  return {
    wallTileId: tileOf('wall'),
    trimTileId: tileOf('beam'),
    roofSlopeTileId: tileOf('roofSlope'),
    roofRidgeTileId: tileOf('roofRidge'),
    floorTileId: tileOf('floor'),
    pathTileId: tileOf('path'),
  };
}

function roleBindingsOfPieces(pieces: readonly Piece[]): PieceRoleBindings {
  const bindings: PieceRoleBindings = {};
  for (const piece of pieces) bindings[piece.role] = [...(bindings[piece.role] ?? []), piece.id];
  return bindings;
}

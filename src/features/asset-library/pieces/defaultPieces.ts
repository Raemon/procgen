import type { PieceId } from '@/features/asset-library/asset';
import { generatedPieces } from '../generation/generatedAssets';
import { furnishingPieceBlueprints } from './defaults/furnishingPieces';
import { pieceFromBlueprint, type PieceBlueprint } from './defaults/pieceBlueprint';
import { stonewoldPieceBlueprints } from './defaults/stonewoldPieces';
import { thatchmerePieceBlueprints } from './defaults/thatchmerePieces';
import type { Piece } from './pieceDef';

export function defaultPieces(): Piece[] {
  return [
    ...pieceBlueprints().map((blueprint, index) => pieceFromBlueprint(blueprint, index as PieceId)),
    ...generatedPieces,
  ];
}

export function defaultPieceId(name: string): PieceId {
  return pieceBlueprints().findIndex((blueprint) => blueprint.name === name) as PieceId;
}

function pieceBlueprints(): PieceBlueprint[] {
  return [
    ...stonewoldPieceBlueprints(),
    ...thatchmerePieceBlueprints(),
    ...furnishingPieceBlueprints(),
  ];
}

import { furnishingPieceBlueprints } from './defaults/furnishingPieces';
import { pieceFromBlueprint, type PieceBlueprint } from './defaults/pieceBlueprint';
import { stonewoldPieceBlueprints } from './defaults/stonewoldPieces';
import { thatchmerePieceBlueprints } from './defaults/thatchmerePieces';
import type { Piece } from './pieceDef';

export function defaultPieces(): Piece[] {
  return pieceBlueprints().map(pieceFromBlueprint);
}

export function defaultPieceId(name: string): number {
  return pieceBlueprints().findIndex((blueprint) => blueprint.name === name);
}

function pieceBlueprints(): PieceBlueprint[] {
  return [
    ...stonewoldPieceBlueprints(),
    ...thatchmerePieceBlueprints(),
    ...furnishingPieceBlueprints(),
  ];
}

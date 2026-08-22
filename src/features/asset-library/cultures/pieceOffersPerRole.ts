import type { PieceId } from '@/features/asset-library/asset';
import { PIECE_ROLES, type Piece, type PieceRole } from '../pieces/pieceDef';
import { piecesBoundToRole, type Culture } from './cultureDef';

export interface PieceOfferForRole {
  role: PieceRole;
  offered: Piece[];
}

export function pieceOffersPerRole(
  pieces: readonly Piece[],
  culture: Culture,
): PieceOfferForRole[] {
  return PIECE_ROLES.map((role) => ({ role, offered: piecesOfferedForRole(pieces, culture, role) }))
    .filter((offer) => offer.offered.length > 0);
}

export function piecesOfferedForRole(
  pieces: readonly Piece[],
  culture: Culture,
  role: PieceRole,
): Piece[] {
  const bound = piecesBoundToRole(culture, role);
  return pieces.filter((piece) => piece.role === role || bound.includes(piece.id));
}

export function pieceIdsWithPieceToggled(
  bound: readonly PieceId[],
  pieceId: PieceId,
): PieceId[] {
  const kept = bound.filter((id) => id !== pieceId);
  return kept.length < bound.length ? kept : [...bound, pieceId].sort(byAscendingId);
}

function byAscendingId(left: number, right: number): number {
  return left - right;
}

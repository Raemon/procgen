import { readPersistedDocument, writePersistedDocument } from '@/features/app-shell/persistence/persistedDocumentStore';
import {
  blankFacings,
  DEFAULT_PIECE_ROLE,
  EMPTY_VOXEL,
  isPieceRole,
  MAX_PIECE_LAYERS,
  MAX_PIECE_SIDE,
  type Piece,
} from './pieceDef';

const FILE_NAME = 'pieces';

export function loadStoredPieces(): Piece[] | null {
  return piecesFromStoredJson(readPersistedDocument<unknown>(FILE_NAME));
}

export function piecesFromStoredJson(parsed: unknown): Piece[] | null {
  if (!Array.isArray(parsed)) return null;
  const pieces = parsed.filter(isPiece).map(withDefaultedRoleAndFacings);
  return pieces.length > 0 ? pieces : null;
}

export function storePieces(pieces: readonly Piece[]): void {
  writePersistedDocument(FILE_NAME, pieces);
}

function isPiece(value: unknown): value is Piece {
  if (typeof value !== 'object' || value === null) return false;
  const piece = value as Partial<Piece>;
  if (typeof piece.id !== 'number' || typeof piece.name !== 'string') return false;
  if (!isSide(piece.width, MAX_PIECE_SIDE) || !isSide(piece.depth, MAX_PIECE_SIDE)) return false;
  if (!isSide(piece.layers, MAX_PIECE_LAYERS)) return false;
  return hasVoxelsForExtent(piece as Piece);
}

function withDefaultedRoleAndFacings(piece: Piece): Piece {
  return {
    ...piece,
    role: isPieceRole(piece.role) ? piece.role : DEFAULT_PIECE_ROLE,
    facings: hasFacingsForExtent(piece)
      ? piece.facings
      : blankFacings(piece.width, piece.depth, piece.layers),
  };
}

function hasFacingsForExtent(piece: Piece): boolean {
  return (
    Array.isArray(piece.facings) &&
    piece.facings.length === piece.width * piece.depth * piece.layers &&
    piece.facings.every(isFacing)
  );
}

function isFacing(facing: unknown): boolean {
  return typeof facing === 'number' && Number.isInteger(facing) && facing >= 0 && facing < 4;
}

function isSide(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= max;
}

function hasVoxelsForExtent(piece: Piece): boolean {
  return (
    Array.isArray(piece.voxels) &&
    piece.voxels.length === piece.width * piece.depth * piece.layers &&
    piece.voxels.every((voxel) => typeof voxel === 'number' && voxel >= EMPTY_VOXEL)
  );
}

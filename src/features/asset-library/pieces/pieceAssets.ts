import type { AssetOfKind } from '@/features/asset-library/asset';
import type { PieceId } from '@/features/asset-library/asset';
import { AssetCollection } from '../collection/assetCollection';
import { newPieceWithId, pieceFootprintRadius, type Piece } from './pieceDef';
import { loadStoredPieces, storePieces } from './pieceStorage';

export type PiecePatch = Partial<Omit<Piece, 'id'>>;
export type PieceAddedListener = (piece: Piece) => void;

export class PieceAssets extends AssetCollection<AssetOfKind<'pieces'>> {
  private readonly addedListeners = new Set<PieceAddedListener>();

  constructor(initialPieces?: Piece[]) {
    super(initialPieces ?? loadStoredPieces() ?? []);
  }

  largestFootprint(): number {
    return this.all().reduce(
      (widest, piece) => Math.max(widest, pieceFootprintRadius(piece)),
      1,
    );
  }

  onPieceAdded(listener: PieceAddedListener): () => void {
    this.addedListeners.add(listener);
    return () => this.addedListeners.delete(listener);
  }

  protected blankAsset(id: PieceId): Piece {
    return newPieceWithId(id);
  }

  protected append(piece: Piece): Piece {
    const added = super.append(piece);
    for (const listener of this.addedListeners) listener(added);
    return added;
  }

  protected store(pieces: readonly Piece[]): void {
    storePieces(pieces);
  }
}

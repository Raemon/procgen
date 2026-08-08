import { AssetCollection } from '../collection/assetCollection';
import { newPieceWithId, pieceFootprintRadius, type Piece } from './pieceDef';
import { loadStoredPieces, storePieces } from './pieceStorage';

export type PiecePatch = Partial<Omit<Piece, 'id'>>;
export type PieceAddedListener = (piece: Piece) => void;

export class PieceAssets extends AssetCollection<Piece> {
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

  insert(piece: Omit<Piece, 'id'> & { id?: number }): Piece {
    return this.append({ ...piece, id: this.claimId() } as Piece);
  }

  onPieceAdded(listener: PieceAddedListener): () => void {
    this.addedListeners.add(listener);
    return () => this.addedListeners.delete(listener);
  }

  protected blankAsset(id: number): Piece {
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

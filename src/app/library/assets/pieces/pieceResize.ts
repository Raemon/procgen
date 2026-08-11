import {
  blankFacings,
  blankVoxels,
  facingAt,
  MAX_PIECE_LAYERS,
  MAX_PIECE_SIDE,
  voxelAt,
  withCenteredAnchor,
  type Piece,
} from './pieceDef';

export interface PieceExtent {
  width: number;
  depth: number;
  layers: number;
}

export function resizedPiece(piece: Piece, extent: PieceExtent): Piece {
  const size = clampedExtent(extent);
  const resized: Piece = {
    ...piece,
    ...size,
    voxels: blankVoxels(size.width, size.depth, size.layers),
    facings: blankFacings(size.width, size.depth, size.layers),
  };
  copyOverlappingCells(piece, resized);
  return withCenteredAnchor(resized);
}

function clampedExtent({ width, depth, layers }: PieceExtent): PieceExtent {
  return {
    width: clampSide(width, MAX_PIECE_SIDE),
    depth: clampSide(depth, MAX_PIECE_SIDE),
    layers: clampSide(layers, MAX_PIECE_LAYERS),
  };
}

function clampSide(value: number, max: number): number {
  return Math.min(max, Math.max(1, Math.round(value)));
}

function copyOverlappingCells(from: Piece, into: Piece): void {
  forEachCell(into, (x, y, layer, index) => {
    into.voxels[index] = voxelAt(from, x, y, layer);
    into.facings[index] = facingAt(from, x, y, layer);
  });
}

function forEachCell(
  piece: Piece,
  visit: (x: number, y: number, layer: number, index: number) => void,
): void {
  let index = 0;
  for (let layer = 0; layer < piece.layers; layer++) {
    for (let y = 0; y < piece.depth; y++) {
      for (let x = 0; x < piece.width; x++) visit(x, y, layer, index++);
    }
  }
}

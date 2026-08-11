import {
  blankFacings,
  blankVoxels,
  facingAt,
  voxelAt,
  withCenteredAnchor,
  type Piece,
} from './pieceDef';

export interface FootprintCell {
  x: number;
  y: number;
}

export function normalizedQuarterTurns(turns: number): number {
  return ((Math.round(turns) % 4) + 4) % 4;
}

export function rotatedWidth(piece: Piece, turns: number): number {
  return normalizedQuarterTurns(turns) % 2 === 0 ? piece.width : piece.depth;
}

export function rotatedDepth(piece: Piece, turns: number): number {
  return normalizedQuarterTurns(turns) % 2 === 0 ? piece.depth : piece.width;
}

export function unrotatedCell(piece: Piece, turns: number, x: number, y: number): FootprintCell {
  if (normalizedQuarterTurns(turns) === 1) return { x: y, y: piece.depth - 1 - x };
  if (normalizedQuarterTurns(turns) === 2) {
    return { x: piece.width - 1 - x, y: piece.depth - 1 - y };
  }
  if (normalizedQuarterTurns(turns) === 3) return { x: piece.width - 1 - y, y: x };
  return { x, y };
}

export function rotatedAnchorX(piece: Piece, turns: number): number {
  return anchorAfterRotation(piece, turns).x;
}

export function rotatedAnchorY(piece: Piece, turns: number): number {
  return anchorAfterRotation(piece, turns).y;
}

export function rotatedFacing(facing: number, turns: number): number {
  return (normalizedQuarterTurns(facing) + normalizedQuarterTurns(turns)) % 4;
}

export function rotatedPiece(piece: Piece, turns: number): Piece {
  const width = rotatedWidth(piece, turns);
  const depth = rotatedDepth(piece, turns);
  const rotated: Piece = {
    ...piece,
    width,
    depth,
    voxels: blankVoxels(width, depth, piece.layers),
    facings: blankFacings(width, depth, piece.layers),
  };
  forEachRotatedCell(piece, turns, (index, source, layer) => {
    rotated.voxels[index] = voxelAt(piece, source.x, source.y, layer);
    rotated.facings[index] = rotatedFacing(facingAt(piece, source.x, source.y, layer), turns);
  });
  return withCenteredAnchor(rotated);
}

function forEachRotatedCell(
  piece: Piece,
  turns: number,
  visit: (index: number, source: FootprintCell, layer: number) => void,
): void {
  const width = rotatedWidth(piece, turns);
  const depth = rotatedDepth(piece, turns);
  for (let layer = 0; layer < piece.layers; layer++) {
    for (let y = 0; y < depth; y++) {
      for (let x = 0; x < width; x++) {
        visit((layer * depth + y) * width + x, unrotatedCell(piece, turns, x, y), layer);
      }
    }
  }
}

function anchorAfterRotation(piece: Piece, turns: number): FootprintCell {
  const width = rotatedWidth(piece, turns);
  const depth = rotatedDepth(piece, turns);
  for (let y = 0; y < depth; y++) {
    for (let x = 0; x < width; x++) {
      const source = unrotatedCell(piece, turns, x, y);
      if (source.x === piece.anchorX && source.y === piece.anchorY) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

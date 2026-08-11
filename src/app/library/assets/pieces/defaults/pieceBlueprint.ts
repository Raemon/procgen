import {
  blankFacings,
  blankVoxels,
  withCenteredAnchor,
  type Piece,
  type PieceRole,
} from '../pieceDef';
import { paintFacing, paintVoxel } from '../piecePainting';

export interface PieceBlueprint {
  name: string;
  role: PieceRole;
  width: number;
  depth: number;
  layers: number;
  paint: (piece: Piece) => void;
}

export function pieceFromBlueprint(blueprint: PieceBlueprint, id: number): Piece {
  const piece = blankPieceOfBlueprint(blueprint, id);
  blueprint.paint(piece);
  return piece;
}

export function paintColumn(
  piece: Piece,
  x: number,
  y: number,
  tileIds: readonly number[],
  facing = 0,
): void {
  tileIds.forEach((tileId, layer) => {
    paintVoxel(piece, x, y, layer, tileId);
    paintFacing(piece, x, y, layer, facing);
  });
}

export function paintLayerAcross(piece: Piece, layer: number, tileId: number): void {
  for (let y = 0; y < piece.depth; y++) {
    for (let x = 0; x < piece.width; x++) paintVoxel(piece, x, y, layer, tileId);
  }
}

function blankPieceOfBlueprint(blueprint: PieceBlueprint, id: number): Piece {
  const { width, depth, layers } = blueprint;
  return withCenteredAnchor({
    id,
    name: blueprint.name,
    role: blueprint.role,
    width,
    depth,
    layers,
    anchorX: 0,
    anchorY: 0,
    voxels: blankVoxels(width, depth, layers),
    facings: blankFacings(width, depth, layers),
  });
}

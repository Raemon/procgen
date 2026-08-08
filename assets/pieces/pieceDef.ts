export const EMPTY_VOXEL = -1;
export const MAX_PIECE_SIDE = 48;
export const MAX_PIECE_LAYERS = 24;
export const DEFAULT_FACING = 0;
export const VOXEL_FACING_COUNT = 4;

export const PIECE_ROLES = [
  'wallSegment',
  'wallCorner',
  'doorframe',
  'door',
  'window',
  'roofEdge',
  'roofRidge',
  'roofCorner',
  'roofGableEnd',
  'floor',
  'chimney',
  'furnishing',
  'freestanding',
] as const;

export type PieceRole = (typeof PIECE_ROLES)[number];

export const DEFAULT_PIECE_ROLE: PieceRole = 'freestanding';

export interface Piece {
  id: number;
  name: string;
  role: PieceRole;
  width: number;
  depth: number;
  layers: number;
  anchorX: number;
  anchorY: number;
  voxels: number[];
  facings: number[];
}

export function isPieceRole(value: unknown): value is PieceRole {
  return PIECE_ROLES.includes(value as PieceRole);
}

export function newPieceWithId(id: number): Piece {
  return withCenteredAnchor({
    id,
    name: `piece ${id}`,
    role: DEFAULT_PIECE_ROLE,
    width: 5,
    depth: 5,
    layers: 3,
    anchorX: 2,
    anchorY: 2,
    voxels: blankVoxels(5, 5, 3),
    facings: blankFacings(5, 5, 3),
  });
}

export function blankVoxels(width: number, depth: number, layers: number): number[] {
  return new Array<number>(width * depth * layers).fill(EMPTY_VOXEL);
}

export function blankFacings(width: number, depth: number, layers: number): number[] {
  return new Array<number>(width * depth * layers).fill(DEFAULT_FACING);
}

export function voxelIndex(piece: Piece, x: number, y: number, layer: number): number {
  return (layer * piece.depth + y) * piece.width + x;
}

export function isInsidePiece(piece: Piece, x: number, y: number, layer: number): boolean {
  return (
    x >= 0 && y >= 0 && layer >= 0 && x < piece.width && y < piece.depth && layer < piece.layers
  );
}

export function voxelAt(piece: Piece, x: number, y: number, layer: number): number {
  if (!isInsidePiece(piece, x, y, layer)) return EMPTY_VOXEL;
  return piece.voxels[voxelIndex(piece, x, y, layer)] ?? EMPTY_VOXEL;
}

export function facingAt(piece: Piece, x: number, y: number, layer: number): number {
  if (!isInsidePiece(piece, x, y, layer)) return DEFAULT_FACING;
  return piece.facings[voxelIndex(piece, x, y, layer)] ?? DEFAULT_FACING;
}

export function withVoxelsPainted(
  piece: Piece,
  indices: readonly number[],
  tileId: number,
): Piece {
  const voxels = [...piece.voxels];
  for (const index of indices) if (index >= 0 && index < voxels.length) voxels[index] = tileId;
  return { ...piece, voxels };
}

export function withFacingsPainted(
  piece: Piece,
  indices: readonly number[],
  facing: number,
): Piece {
  const facings = [...piece.facings];
  for (const index of indices) if (index >= 0 && index < facings.length) facings[index] = facing;
  return { ...piece, facings };
}

export function withCenteredAnchor(piece: Piece): Piece {
  return {
    ...piece,
    anchorX: Math.floor(piece.width / 2),
    anchorY: Math.floor(piece.depth / 2),
  };
}

export function filledVoxelCount(piece: Piece): number {
  return piece.voxels.reduce((count, voxel) => count + (voxel === EMPTY_VOXEL ? 0 : 1), 0);
}

export function pieceFootprintRadius(piece: Piece): number {
  return Math.max(piece.width, piece.depth);
}

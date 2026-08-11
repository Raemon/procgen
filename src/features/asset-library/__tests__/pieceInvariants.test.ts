import { pieceFromWorldRegion, type RegionSampler } from '@/features/asset-library/pieces/captureRegionAsPiece';
import {
  blankFacings,
  blankVoxels,
  EMPTY_VOXEL,
  facingAt,
  voxelAt,
  voxelIndex,
  type Piece,
} from '@/features/asset-library/pieces/pieceDef';
import { resizedPiece } from '@/features/asset-library/pieces/pieceResize';
import {
  rotatedAnchorX,
  rotatedAnchorY,
  rotatedDepth,
  rotatedFacing,
  rotatedPiece,
  rotatedWidth,
} from '@/features/asset-library/pieces/pieceRotation';
import { facingOfVoxel, tileIdOfVoxel } from '@/features/asset-library/worlds/structureOverlay/packedVoxel';
import { StructureOverlay, type PieceSource } from '@/features/asset-library/worlds/structureOverlay/structureOverlay';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const SYNTHETIC_PIECE_ID = 3;
const STAMPED_AT = { x: 5, y: 7 };

export function checkPieceInvariants(check: CheckReporter): void {
  checkRotationRoundTrips(check);
  checkResizePreservesWhatItKeeps(check);
  checkStampedPiecesKeepTileAndFacing(check);
  checkCaptureRoundTrip(check);
}

function checkRotationRoundTrips(check: CheckReporter): void {
  const piece = syntheticPiece();
  const fullTurn = rotatedPiece(rotatedPiece(rotatedPiece(rotatedPiece(piece, 1), 1), 1), 1);
  check(
    'four quarter turns return a piece to its original voxels',
    JSON.stringify(fullTurn.voxels) === JSON.stringify(piece.voxels),
  );
  check(
    'four quarter turns return every voxel facing to where it started',
    JSON.stringify(fullTurn.facings) === JSON.stringify(piece.facings),
  );
  check(
    'a quarter turn swaps width and depth',
    rotatedWidth(piece, 1) === piece.depth && rotatedDepth(piece, 1) === piece.width,
  );
  checkOneTurnCarriesFacings(check, piece);
}

function checkOneTurnCarriesFacings(check: CheckReporter, piece: Piece): void {
  const turned = rotatedPiece(piece, 1);
  check(
    'a quarter turn moves each voxel and turns its facing with it',
    everyCell(piece, (x, y, layer) => {
      const movedX = piece.depth - 1 - y;
      const movedY = x;
      return (
        voxelAt(turned, movedX, movedY, layer) === voxelAt(piece, x, y, layer) &&
        facingAt(turned, movedX, movedY, layer) === rotatedFacing(facingAt(piece, x, y, layer), 1)
      );
    }),
  );
}

function checkResizePreservesWhatItKeeps(check: CheckReporter): void {
  const piece = syntheticPiece();
  const grown = resizedPiece(piece, {
    width: piece.width + 2,
    depth: piece.depth + 2,
    layers: piece.layers + 1,
  });
  check(
    'growing a piece keeps every voxel it already had',
    everyCell(piece, (x, y, layer) => voxelAt(grown, x, y, layer) === voxelAt(piece, x, y, layer)),
  );
  check(
    'growing a piece keeps the facing of every voxel it already had',
    everyCell(piece, (x, y, layer) => facingAt(grown, x, y, layer) === facingAt(piece, x, y, layer)),
  );
  check(
    'the space a grown piece gains starts empty and unturned',
    voxelAt(grown, piece.width, piece.depth, 0) === EMPTY_VOXEL &&
      facingAt(grown, piece.width, piece.depth, 0) === 0,
  );
  check(
    'shrinking a piece keeps the corner voxel and drops the rest',
    shrunkToOneVoxel(piece).voxels.length === 1 &&
      shrunkToOneVoxel(piece).voxels[0] === voxelAt(piece, 0, 0, 0),
  );
}

function shrunkToOneVoxel(piece: Piece): Piece {
  return resizedPiece(piece, { width: 1, depth: 1, layers: 1 });
}

function checkStampedPiecesKeepTileAndFacing(check: CheckReporter): void {
  const piece = syntheticPiece();
  check(
    'a stamped piece reaches the world with the tile and facing every voxel was painted with',
    everyStampedVoxelMatches(piece, 0),
  );
  check(
    'a piece stamped a quarter turn round keeps its tiles and turns its facings with it',
    everyStampedVoxelMatches(piece, 1),
  );
}

function everyStampedVoxelMatches(piece: Piece, turns: number): boolean {
  const overlay = stampedOverlay(piece, turns);
  const turned = rotatedPiece(piece, turns);
  const origin = stampOriginOf(piece, turns);
  return everyCell(turned, (x, y, layer) => {
    const packed = overlay.packedColumnAt(origin.x + x, origin.y + y)?.[layer] ?? EMPTY_VOXEL;
    const tileId = voxelAt(turned, x, y, layer);
    if (tileId === EMPTY_VOXEL) return true;
    return (
      tileIdOfVoxel(packed) === tileId && facingOfVoxel(packed) === facingAt(turned, x, y, layer)
    );
  });
}

function stampedOverlay(piece: Piece, turns: number): StructureOverlay {
  return new StructureOverlay(pieceSourceOf(piece), (chunkX, chunkY) =>
    chunkX === 0 && chunkY === 0
      ? [{ x: STAMPED_AT.x, y: STAMPED_AT.y, pieceId: SYNTHETIC_PIECE_ID, rotation: turns }]
      : [],
  );
}

function stampOriginOf(piece: Piece, turns: number): { x: number; y: number } {
  return {
    x: STAMPED_AT.x - rotatedAnchorX(piece, turns),
    y: STAMPED_AT.y - rotatedAnchorY(piece, turns),
  };
}

function pieceSourceOf(piece: Piece): PieceSource {
  return {
    byId: (id) => (id === SYNTHETIC_PIECE_ID ? piece : undefined),
    largestFootprint: () => Math.max(piece.width, piece.depth),
  };
}

function checkCaptureRoundTrip(check: CheckReporter): void {
  const piece = syntheticPiece();
  const captured = capturedFromStamp(piece);
  check(
    'capturing a stamped piece out of the world keeps its footprint',
    captured.width === piece.width && captured.depth === piece.depth,
  );
  check(
    'capturing a stamped piece keeps every voxel and its facing',
    everyCell(piece, (x, y, layer) => {
      const tileId = voxelAt(piece, x, y, layer);
      if (tileId === EMPTY_VOXEL) return true;
      return (
        voxelAt(captured, x, y, layer) === tileId &&
        facingAt(captured, x, y, layer) === facingAt(piece, x, y, layer)
      );
    }),
  );
}

function capturedFromStamp(piece: Piece): Piece {
  const origin = stampOriginOf(piece, 0);
  const region = {
    minX: origin.x,
    minY: origin.y,
    maxX: origin.x + piece.width - 1,
    maxY: origin.y + piece.depth - 1,
  };
  return {
    ...pieceFromWorldRegion(samplerOverEmptyGround(stampedOverlay(piece, 0)), region, 'captured'),
    id: 0,
  };
}

function samplerOverEmptyGround(overlay: StructureOverlay): RegionSampler {
  return {
    tileAt: () => EMPTY_VOXEL,
    elevationAt: () => 0,
    packedVoxelColumnAt: (x, y) => overlay.packedColumnAt(x, y),
  };
}

function syntheticPiece(): Piece {
  const piece: Piece = {
    id: SYNTHETIC_PIECE_ID,
    name: 'facing test piece',
    role: 'wallSegment',
    width: 3,
    depth: 2,
    layers: 2,
    anchorX: 1,
    anchorY: 1,
    voxels: blankVoxels(3, 2, 2),
    facings: blankFacings(3, 2, 2),
  };
  everyCell(piece, (x, y, layer) => paintDistinctVoxel(piece, x, y, layer));
  return piece;
}

function paintDistinctVoxel(piece: Piece, x: number, y: number, layer: number): boolean {
  const index = voxelIndex(piece, x, y, layer);
  piece.voxels[index] = index === 0 ? EMPTY_VOXEL : 10 + index;
  piece.facings[index] = index % 4;
  return true;
}

function everyCell(piece: Piece, holds: (x: number, y: number, layer: number) => boolean): boolean {
  const cells: boolean[] = [];
  for (let layer = 0; layer < piece.layers; layer++) {
    for (let y = 0; y < piece.depth; y++) {
      for (let x = 0; x < piece.width; x++) cells.push(holds(x, y, layer));
    }
  }
  return cells.every(Boolean);
}

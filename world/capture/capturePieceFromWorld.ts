import {
  pieceFromWorldRegion,
  regionSize,
  type RegionSampler,
  type WorldRegion,
} from '../../assets/pieces/captureRegionAsPiece';
import type { Piece } from '../../assets/pieces/pieceDef';
import type { PieceAssets } from '../../assets/pieces/pieceAssets';

export function capturePieceFromWorld(
  pieces: PieceAssets,
  sampler: RegionSampler,
  region: WorldRegion,
): Piece {
  return pieces.insert(pieceFromWorldRegion(sampler, region, capturedName(region)));
}

function capturedName(region: WorldRegion): string {
  const { width, depth } = regionSize(region);
  return `capture ${width}×${depth}`;
}

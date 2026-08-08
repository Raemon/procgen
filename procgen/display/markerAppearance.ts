import type { CubeFaceArt } from '../../assets/tiles/tileFaceArt';
import type { ReadOnlyTileAssets } from '../../frontend/readOnlyAssets';
import type { DisplayBinding } from './displayBinding';

export type MarkerBinding = Extract<DisplayBinding, { mode: 'markers' }>;

export interface MarkerAppearance {
  glyph: string;
  color: string;
  faceArt: CubeFaceArt | null;
}

export function markerAppearance(tileAssets: ReadOnlyTileAssets, binding: MarkerBinding): MarkerAppearance {
  const tile = binding.tileId >= 0 ? tileAssets.byId(binding.tileId) : undefined;
  if (!tile) return { glyph: binding.glyph, color: binding.color, faceArt: null };
  return { glyph: tile.symbol, color: tile.color, faceArt: tile.faceArt };
}

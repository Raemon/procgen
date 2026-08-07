import type { CubeFaceArt } from '../../library/tiles/tileFaceArt';
import type { ReadOnlyTileset } from '../../frontend/readOnlyLibraries';
import type { DisplayBinding } from './displayBinding';

export type MarkerBinding = Extract<DisplayBinding, { mode: 'markers' }>;

export interface MarkerAppearance {
  glyph: string;
  color: string;
  faceArt: CubeFaceArt | null;
}

export function markerAppearance(tileset: ReadOnlyTileset, binding: MarkerBinding): MarkerAppearance {
  const tile = binding.tileId >= 0 ? tileset.byId(binding.tileId) : undefined;
  if (!tile) return { glyph: binding.glyph, color: binding.color, faceArt: null };
  return { glyph: tile.symbol, color: tile.color, faceArt: tile.faceArt };
}

import { billboardHeightOfTile } from '../../assets/tiles/art/billboards/billboardKind';
import { markerBillboardArt } from '../../assets/tiles/art/billboards/markerBillboardArt';
import type { TileDef } from '../../assets/tiles/tileDef';
import type { CubeFaceArt } from '../../assets/tiles/tileFaceArt';
import type { ReadOnlyTileAssets } from '../../frontend/readOnlyAssets';
import type { DisplayBinding } from './displayBinding';

export type MarkerBinding = Extract<DisplayBinding, { mode: 'markers' }>;

export interface MarkerAppearance {
  glyph: string;
  color: string;
  faceArt: CubeFaceArt | null;
  billboardHeight?: number;
  seeThroughUnpaintedArt?: boolean;
}

export function markerAppearance(tileAssets: ReadOnlyTileAssets, binding: MarkerBinding): MarkerAppearance {
  const tile = binding.tileId >= 0 ? tileAssets.byId(binding.tileId) : undefined;
  if (!tile) return { glyph: binding.glyph, color: binding.color, faceArt: null };
  return billboardAppearanceOfTile(tile);
}

function billboardAppearanceOfTile(tile: TileDef): MarkerAppearance {
  return {
    glyph: tile.symbol,
    color: tile.color,
    faceArt: markerBillboardArt(tile),
    billboardHeight: billboardHeightOfTile(tile),
    seeThroughUnpaintedArt: true,
  };
}

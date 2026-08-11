import { billboardHeightOfTile } from '@/features/asset-library/tiles/art/billboards/billboardKind';
import { markerBillboardArt } from '@/features/asset-library/tiles/art/billboards/markerBillboardArt';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import type { CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
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

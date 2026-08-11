import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import { TileFacePreview } from '@/features/asset-library/tiles/editor/TileFacePreview';
import { AssetIconFrame } from './AssetIconFrame';

export function TileIcon({ tile }: { tile: TileDef }) {
  return (
    <AssetIconFrame>
      <TileFacePreview tile={tile} />
    </AssetIconFrame>
  );
}

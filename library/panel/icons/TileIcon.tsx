import type { TileDef } from '../../../assets/tiles/tileDef';
import { TileFacePreview } from '../../../assets/tiles/editor/TileFacePreview';
import { AssetIconFrame } from './AssetIconFrame';

export function TileIcon({ tile }: { tile: TileDef }) {
  return (
    <AssetIconFrame>
      <TileFacePreview tile={tile} />
    </AssetIconFrame>
  );
}

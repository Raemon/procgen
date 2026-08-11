import type { TileDef } from '../tileDef';
import { IconButton } from '@/features/app-shell/controls/IconButton';
import { ASSET_ICON_STYLE } from '@/features/asset-library/panel/icons/AssetIconFrame';
import { TILE_ART_TIP } from './help/tileTips';
import { TileFacePreview } from './TileFacePreview';

export function FaceArtToggle({
  tile,
  open,
  onToggle,
}: {
  tile: TileDef;
  open: boolean;
  onToggle(): void;
}) {
  return (
    <IconButton style={ASSET_ICON_STYLE} tip={TILE_ART_TIP} active={open} onClick={onToggle}>
      <TileFacePreview tile={tile} />
    </IconButton>
  );
}

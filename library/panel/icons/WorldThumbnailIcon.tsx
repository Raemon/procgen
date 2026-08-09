import { WorldIcon } from '../../../frontend/icons/panelIcons';
import { AssetIconFrame } from './AssetIconFrame';
import { useWorldThumbnail } from './useWorldThumbnail';

const GLYPH_SIZE = 20;

export function WorldThumbnailIcon({ worldKey }: { worldKey: string }) {
  const thumbnail = useWorldThumbnail(worldKey);
  return (
    <AssetIconFrame>
      {thumbnail ? (
        <img src={thumbnail} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-ink-dim">
          <WorldIcon size={GLYPH_SIZE} />
        </span>
      )}
    </AssetIconFrame>
  );
}

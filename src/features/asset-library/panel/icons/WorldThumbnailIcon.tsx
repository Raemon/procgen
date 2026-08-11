import { WorldIcon } from '@/features/app-shell/icons/panelIcons';
import { AssetIconFrame } from './AssetIconFrame';
import { useWorldThumbnail } from './useWorldThumbnail';

const GLYPH_SIZE = 20;

export function WorldThumbnailIcon({ worldName }: { worldName: string }) {
  const thumbnail = useWorldThumbnail(worldName);
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

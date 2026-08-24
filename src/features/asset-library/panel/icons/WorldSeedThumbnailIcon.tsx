import { WorldIcon } from '@/features/app-shell/icons/panelIcons';
import { AssetIconFrame } from './AssetIconFrame';
import { useWorldSeedThumbnail } from './useWorldSeedThumbnail';

const GLYPH_SIZE = 20;

export function WorldSeedThumbnailIcon({ worldName }: { worldName: string }) {
  const thumbnail = useWorldSeedThumbnail(worldName);
  return (
    <AssetIconFrame>
      {thumbnail ? (
        <img src={thumbnail} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-ink-dim [&>svg]:h-[62.5%] [&>svg]:w-[62.5%]">
          <WorldIcon size={GLYPH_SIZE} />
        </span>
      )}
    </AssetIconFrame>
  );
}

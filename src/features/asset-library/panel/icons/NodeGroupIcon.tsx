import { Icon } from '@/features/app-shell/icons/Icon';
import { AssetIconFrame } from './AssetIconFrame';

const GLYPH_SIZE = 22;

export function NodeGroupIcon() {
  return (
    <AssetIconFrame>
      <Icon size={GLYPH_SIZE} className="h-[68.75%] w-[68.75%] text-ink-dim">
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="12" r="2.5" />
        <path d="M8.5 7.2 15.6 11" />
        <path d="M8.5 16.8 15.6 13" />
      </Icon>
    </AssetIconFrame>
  );
}

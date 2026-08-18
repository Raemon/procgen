import { AssetIconFrame } from './AssetIconFrame';

export function GlyphIcon({ glyph, tint }: { glyph: string; tint?: string }) {
  return (
    <AssetIconFrame tint={tint}>
      <span className="text-[calc(var(--asset-icon-size,32px)/2)] leading-none">{glyph}</span>
    </AssetIconFrame>
  );
}

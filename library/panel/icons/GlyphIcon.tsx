import { AssetIconFrame } from './AssetIconFrame';

export function GlyphIcon({ glyph, tint }: { glyph: string; tint?: string }) {
  return (
    <AssetIconFrame tint={tint}>
      <span className="text-base leading-none">{glyph}</span>
    </AssetIconFrame>
  );
}

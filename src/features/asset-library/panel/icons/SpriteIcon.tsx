import { isEntirelyTransparent, type SpriteArt } from '@/features/asset-library/tiles/spriteArt';
import { PixelGridCanvas } from '@/features/asset-library/pixelArtEditor/PixelGridCanvas';
import { AssetIconFrame } from './AssetIconFrame';
import { GlyphIcon } from './GlyphIcon';

export function SpriteIcon({
  sprite,
  glyph,
  tint,
}: {
  sprite: SpriteArt | null;
  glyph: string;
  tint: string;
}) {
  if (!sprite || isEntirelyTransparent(sprite)) return <GlyphIcon glyph={glyph} tint={tint} />;
  return (
    <AssetIconFrame>
      <PixelGridCanvas pixels={sprite} className="block h-full w-full [image-rendering:pixelated]" />
    </AssetIconFrame>
  );
}

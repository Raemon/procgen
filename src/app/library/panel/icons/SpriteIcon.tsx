import { useEffect, useRef } from 'react';
import { isEntirelyTransparent, spriteGridSize, type SpriteArt } from '../../../assets/tiles/spriteArt';
import { paintSpritePixels } from '../../../world/render/paintSpritePixels';
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
      <SpriteCanvas sprite={sprite} />
    </AssetIconFrame>
  );
}

function SpriteCanvas({ sprite }: { sprite: SpriteArt }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) drawSprite(canvas.current, sprite);
  }, [sprite]);
  return (
    <canvas ref={canvas} className="block h-full w-full [image-rendering:pixelated]" />
  );
}

function drawSprite(canvas: HTMLCanvasElement, sprite: SpriteArt): void {
  canvas.width = canvas.height = spriteGridSize(sprite);
  paintSpritePixels(canvas.getContext('2d')!, sprite, 1);
}

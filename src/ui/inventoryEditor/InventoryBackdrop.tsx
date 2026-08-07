import { useEffect, useRef } from 'react';
import { paintSpritePixels } from '../../views/paintSpritePixels';
import { spriteGridSize, type SpriteArt } from '../../world/tiles/spriteArt';

export function InventoryBackdrop({ background }: { background: SpriteArt }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const size = spriteGridSize(background);
    canvas.current.width = canvas.current.height = size;
    paintSpritePixels(canvas.current.getContext('2d')!, background, 1);
  }, [background]);
  return (
    <canvas
      ref={canvas}
      className="pointer-events-none absolute inset-0 h-full w-full [image-rendering:pixelated]"
    />
  );
}

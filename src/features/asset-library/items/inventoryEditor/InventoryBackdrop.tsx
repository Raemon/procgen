import { PixelGridCanvas } from '../../pixelArtEditor/PixelGridCanvas';
import type { SpriteArt } from '../../tiles/spriteArt';

export function InventoryBackdrop({ background }: { background: SpriteArt }) {
  return (
    <PixelGridCanvas
      pixels={background}
      className="pointer-events-none absolute inset-0 h-full w-full [image-rendering:pixelated]"
    />
  );
}

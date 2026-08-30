import { PixelGridCanvas } from '../../pixelArtEditor/PixelGridCanvas';
import type { TileDef } from '../tileDef';
import { blankFacePixels } from '../tileFaceArt';

const UNPAINTED_FACE = blankFacePixels();

export function TileFacePreview({ tile }: { tile: TileDef }) {
  return (
    <PixelGridCanvas
      pixels={tile.faceArt?.top ?? UNPAINTED_FACE}
      unpainted={tile.color}
      className="block h-full w-full rounded-[2px] [image-rendering:pixelated]"
    />
  );
}

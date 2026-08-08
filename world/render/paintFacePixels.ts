import { faceGridSize, type FacePixels } from '../../library/tiles/tileFaceArt';
import { paintPixelsAsImage } from './paintPixelsAsImage';

export function paintFacePixels(
  ctx: CanvasRenderingContext2D,
  pixels: FacePixels,
  unpainted: string | null,
  pixelSize: number,
): void {
  const size = faceGridSize(pixels);
  ctx.clearRect(0, 0, size * pixelSize, size * pixelSize);
  if (pixelSize === 1) {
    paintPixelsAsImage(ctx, pixels, size, unpainted);
    return;
  }
  pixels.forEach((pixel, index) => {
    const ink = pixel ?? unpainted;
    if (ink === null) return;
    ctx.fillStyle = ink;
    ctx.fillRect(
      (index % size) * pixelSize,
      Math.floor(index / size) * pixelSize,
      pixelSize,
      pixelSize,
    );
  });
}

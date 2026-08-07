import { faceGridSize, type FacePixels } from '../world/tiles/tileFaceArt';
import { paintPixelsAsImage } from './paintPixelsAsImage';

export function paintFacePixels(
  ctx: CanvasRenderingContext2D,
  pixels: FacePixels,
  baseColor: string,
  pixelSize: number,
): void {
  const size = faceGridSize(pixels);
  ctx.clearRect(0, 0, size * pixelSize, size * pixelSize);
  if (pixelSize === 1) {
    paintPixelsAsImage(ctx, pixels, size, baseColor);
    return;
  }
  pixels.forEach((pixel, index) => {
    ctx.fillStyle = pixel ?? baseColor;
    ctx.fillRect(
      (index % size) * pixelSize,
      Math.floor(index / size) * pixelSize,
      pixelSize,
      pixelSize,
    );
  });
}

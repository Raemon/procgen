import { faceGridSize, type FacePixels } from '../world/tiles/tileFaceArt';

export function paintFacePixels(
  ctx: CanvasRenderingContext2D,
  pixels: FacePixels,
  baseColor: string,
  pixelSize: number,
): void {
  const size = faceGridSize(pixels);
  ctx.clearRect(0, 0, size * pixelSize, size * pixelSize);
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

import { FACE_ART_SIZE, type FacePixels } from '../world/tiles/tileFaceArt';

export function paintFacePixels(
  ctx: CanvasRenderingContext2D,
  pixels: FacePixels,
  baseColor: string,
  pixelSize: number,
): void {
  pixels.forEach((pixel, index) => {
    ctx.fillStyle = pixel ?? baseColor;
    ctx.fillRect(
      (index % FACE_ART_SIZE) * pixelSize,
      Math.floor(index / FACE_ART_SIZE) * pixelSize,
      pixelSize,
      pixelSize,
    );
  });
}

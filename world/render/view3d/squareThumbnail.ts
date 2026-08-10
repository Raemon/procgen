export function squareThumbnailOf(canvas: HTMLCanvasElement, size: number): string {
  const thumbnail = document.createElement('canvas');
  thumbnail.width = thumbnail.height = size;
  const side = Math.min(canvas.width, canvas.height);
  thumbnail
    .getContext('2d')!
    .drawImage(
      canvas,
      (canvas.width - side) / 2,
      (canvas.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
  return thumbnail.toDataURL('image/png');
}

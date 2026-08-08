import { blankFacePixels, type FacePixels } from '../tileFaceArt';

export type PixelPainter = (x: number, y: number) => string | null;

export function paintedFace(size: number, painter: PixelPainter): FacePixels {
  const pixels = blankFacePixels(size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) pixels[y * size + x] = painter(x, y);
  }
  return pixels;
}

export function stackedPainters(...painters: PixelPainter[]): PixelPainter {
  return (x, y) => painters.reduce<string | null>((below, painter) => painter(x, y) ?? below, null);
}

export function flatPainter(color: string): PixelPainter {
  return () => color;
}

export function quarterTurned(painter: PixelPainter): PixelPainter {
  return (x, y) => painter(y, x);
}

export function wrapped(value: number, size: number): number {
  return ((value % size) + size) % size;
}

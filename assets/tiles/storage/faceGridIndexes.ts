import type { FacePixels } from '../tileFaceArt';
import { base64OfBytes, bytesOfBase64 } from './base64Bytes';
import { bytesPerIndex } from './faceArtPalette';

const UNPAINTED_INDEX = 0;

export function base64OfFaceGrid(
  pixels: FacePixels,
  indexes: ReadonlyMap<string, number>,
  width: number,
): string {
  const bytes = new Uint8Array(pixels.length * width);
  for (let at = 0; at < pixels.length; at += 1) {
    const pixel = pixels[at];
    const index = pixel === null || pixel === undefined ? UNPAINTED_INDEX : indexes.get(pixel)!;
    writeIndex(bytes, at * width, width, index);
  }
  return base64OfBytes(bytes);
}

export function faceGridOfBase64(
  value: unknown,
  palette: readonly string[],
  size: number,
): FacePixels | null {
  if (typeof value !== 'string') return null;
  const width = bytesPerIndex(palette);
  const bytes = bytesOfBase64(value);
  if (bytes === null || bytes.length !== size * size * width) return null;
  return pixelsOfIndexBytes(bytes, width, palette);
}

function pixelsOfIndexBytes(
  bytes: Uint8Array,
  width: number,
  palette: readonly string[],
): FacePixels | null {
  const pixels: FacePixels = new Array<string | null>(bytes.length / width);
  for (let at = 0; at < pixels.length; at += 1) {
    const index = readIndex(bytes, at * width, width);
    if (index > palette.length) return null;
    pixels[at] = index === UNPAINTED_INDEX ? null : palette[index - 1]!;
  }
  return pixels;
}

function writeIndex(bytes: Uint8Array, at: number, width: number, index: number): void {
  if (width === 1) bytes[at] = index;
  else {
    bytes[at] = index >> 8;
    bytes[at + 1] = index & 0xff;
  }
}

function readIndex(bytes: Uint8Array, at: number, width: number): number {
  return width === 1 ? bytes[at]! : (bytes[at]! << 8) | bytes[at + 1]!;
}

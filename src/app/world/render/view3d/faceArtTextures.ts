import * as THREE from 'three';
import { faceArtMips, mipLevelWithin, mipWithin } from '../../../assets/tiles/mips/faceArtMips';
import type { FacePixels } from '../../../assets/tiles/tileFaceArt';
import { paintFacePixels } from '../paintFacePixels';
import { normalTextureFromHeights } from './normalTextureFromHeights';

let colorTextures = new WeakMap<FacePixels, Map<string, THREE.CanvasTexture>>();
let normalTextures = new WeakMap<FacePixels, THREE.DataTexture>();
const sharedTextures = new Set<THREE.Texture>();

export function isSharedFaceArtTexture(texture: THREE.Texture): boolean {
  return sharedTextures.has(texture);
}

export function faceArtMipLevel(
  pixels: FacePixels,
  unpainted: string | null,
  sideBudget: number,
): number {
  return mipLevelWithin(faceArtMips(pixels, unpainted), sideBudget);
}

export function faceArtColorTexture(
  pixels: FacePixels,
  unpainted: string | null,
  sideBudget: number,
): THREE.Texture {
  const mips = faceArtMips(pixels, unpainted);
  const byLevel = colorTextures.get(pixels) ?? new Map<string, THREE.CanvasTexture>();
  colorTextures.set(pixels, byLevel);
  const key = `${unpainted ?? 'transparent'}|${mipLevelWithin(mips, sideBudget)}`;
  const cached = byLevel.get(key);
  if (cached) return cached;
  const texture = shared(pixelCrispTexture(canvasOfInks(mipWithin(mips, sideBudget).inks)));
  byLevel.set(key, texture);
  return texture;
}

export function faceArtNormalTexture(pixels: FacePixels): THREE.Texture {
  const cached = normalTextures.get(pixels);
  if (cached) return cached;
  const texture = shared(normalTextureFromHeights(pixels));
  normalTextures.set(pixels, texture);
  return texture;
}

export function disposeSharedFaceArtTextures(): void {
  for (const texture of sharedTextures) texture.dispose();
  sharedTextures.clear();
  colorTextures = new WeakMap();
  normalTextures = new WeakMap();
}

function shared<T extends THREE.Texture>(texture: T): T {
  sharedTextures.add(texture);
  return texture;
}

function canvasOfInks(inks: FacePixels): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.round(Math.sqrt(inks.length));
  paintFacePixels(canvas.getContext('2d')!, inks, null, 1);
  return canvas;
}

function pixelCrispTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

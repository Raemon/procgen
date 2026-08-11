import * as THREE from 'three';
import { materialSynthById } from '@/features/asset-library/textures/materialCatalog';
import type { TextureFace } from '@/features/asset-library/textures/materialSynth';

const loadedTextures = new Map<string, THREE.Texture>();

export function canLoadPngTextures(): boolean {
  return typeof document !== 'undefined' && typeof Image !== 'undefined';
}

export function pngTextureFaceOf(textureId: string, face: TextureFace): TextureFace {
  const synth = materialSynthById(textureId);
  return synth && synth.faces.includes(face) ? face : 'top';
}

export function pngColorTexture(textureId: string, face: TextureFace): THREE.Texture {
  return cachedTexture(`/textures/${textureId}/${pngTextureFaceOf(textureId, face)}.png`, true);
}

export function pngNormalTexture(textureId: string, face: TextureFace): THREE.Texture {
  return cachedTexture(`/textures/${textureId}/${pngTextureFaceOf(textureId, face)}_n.png`, false);
}

export function disposeSharedPngTextures(): void {
  for (const texture of loadedTextures.values()) texture.dispose();
  loadedTextures.clear();
}

function cachedTexture(url: string, srgb: boolean): THREE.Texture {
  const cached = loadedTextures.get(url);
  if (cached) return cached;
  const texture = repeatingMippedTexture(new THREE.TextureLoader().load(url), srgb);
  loadedTextures.set(url, texture);
  return texture;
}

function repeatingMippedTexture(texture: THREE.Texture, srgb: boolean): THREE.Texture {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

import * as THREE from 'three';
import { opaqueInk } from '@/features/asset-library/tiles/inkColor';
import { canLoadPngTextures, pngColorTexture, pngNormalTexture } from './pngTileTextures';
import type { TextureFace } from '@/features/asset-library/textures/materialSynth';
import { glowSelfLit } from './selfLitGlow';

const BOX_FACE_TEXTURE_FACES: TextureFace[] = ['side', 'side', 'top', 'top', 'side', 'side'];
const NORMAL_RELIEF = 0.85;
const cachedCubes = new Map<string, THREE.Material[]>();

export function pngCubeMaterials(textureId: string, baseColor: string, glow: number): THREE.Material[] {
  const key = `${textureId}|${baseColor}|${glow}`;
  const cached = cachedCubes.get(key);
  if (cached) return cached;
  const materials = builtCubeMaterials(textureId, baseColor, glow);
  cachedCubes.set(key, materials);
  return materials;
}

export function disposeSharedPngMaterials(): void {
  for (const materials of cachedCubes.values()) for (const material of materials) material.dispose();
  cachedCubes.clear();
}

function builtCubeMaterials(textureId: string, baseColor: string, glow: number): THREE.Material[] {
  const materials = BOX_FACE_TEXTURE_FACES.map((face) => pngFaceMaterial(textureId, face, baseColor));
  glowSelfLit(materials, glow, opaqueInk(baseColor));
  return materials;
}

function pngFaceMaterial(
  textureId: string,
  face: TextureFace,
  baseColor: string,
): THREE.MeshLambertMaterial {
  if (!canLoadPngTextures()) return new THREE.MeshLambertMaterial({ color: baseColor });
  return new THREE.MeshLambertMaterial({
    map: pngColorTexture(textureId, face),
    normalMap: pngNormalTexture(textureId, face),
    normalScale: new THREE.Vector2(NORMAL_RELIEF, NORMAL_RELIEF),
  });
}

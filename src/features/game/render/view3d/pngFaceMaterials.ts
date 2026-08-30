import * as THREE from 'three';
import { opaqueInk } from '@/features/asset-library/tiles/inkColor';
import { canLoadPngTextures, pngColorTexture, pngNormalTexture } from './pngTileTextures';
import type { TextureFace } from '@/features/asset-library/textures/materialSynth';
import { glowSelfLit } from './selfLitGlow';
import { pullTowardCamera } from './coplanarPull';
import { MAX_FACE_ART_SIZE } from '@/features/asset-library/tiles/tileFaceArt';
import { drawsPngColorAt, drawsPngNormalAt } from './tileDetailBudget';

const BOX_FACE_TEXTURE_FACES: TextureFace[] = ['side', 'side', 'top', 'top', 'side', 'side'];
const NORMAL_RELIEF = 0.85;
const cachedCubes = new Map<string, THREE.Material[]>();

export function pngCubeMaterials(
  textureId: string,
  baseColor: string,
  glow: number,
  sideBudget: number = MAX_FACE_ART_SIZE,
  pull = 0,
): THREE.Material[] {
  const detail = materialDetail(sideBudget);
  const key = `${textureId}|${baseColor}|${glow}|${detail}|${pull}`;
  const cached = cachedCubes.get(key);
  if (cached) return cached;
  const materials = builtCubeMaterials(textureId, baseColor, glow, sideBudget);
  pullTowardCamera(materials, pull);
  cachedCubes.set(key, materials);
  return materials;
}

export function disposeSharedPngMaterials(): void {
  for (const materials of cachedCubes.values()) for (const material of materials) material.dispose();
  cachedCubes.clear();
}

function builtCubeMaterials(
  textureId: string,
  baseColor: string,
  glow: number,
  sideBudget: number,
): THREE.Material[] {
  const materials = BOX_FACE_TEXTURE_FACES.map((face) =>
    pngFaceMaterial(textureId, face, sideBudget),
  );
  glowSelfLit(materials, glow, opaqueInk(baseColor));
  return materials;
}

function pngFaceMaterial(
  textureId: string,
  face: TextureFace,
  sideBudget: number,
): THREE.MeshLambertMaterial {
  if (!canLoadPngTextures() || !drawsPngColorAt(sideBudget)) {
    return new THREE.MeshLambertMaterial();
  }
  return new THREE.MeshLambertMaterial({
    map: pngColorTexture(textureId, face),
    normalMap: drawsPngNormalAt(sideBudget) ? pngNormalTexture(textureId, face) : null,
    normalScale: new THREE.Vector2(NORMAL_RELIEF, NORMAL_RELIEF),
  });
}

function materialDetail(sideBudget: number): 'flat' | 'color' | 'normal' {
  if (!drawsPngColorAt(sideBudget)) return 'flat';
  return drawsPngNormalAt(sideBudget) ? 'normal' : 'color';
}

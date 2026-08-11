import * as THREE from 'three';
import type { CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import { opaqueInk } from '@/features/asset-library/tiles/inkColor';
import { stopFaceArtAnimation } from './faceArtAnimations';
import { disposeSharedFaceArtTextures } from './faceArtTextures';
import { cubeFaceMaterials } from './faceArtMaterials';
import { glowSelfLit } from './selfLitGlow';

export interface TileSurface {
  art: CubeFaceArt;
  baseColor: string;
  glow: number;
}

type SurfaceMaterials = THREE.Material | THREE.Material[];

let materialsByArt = new WeakMap<CubeFaceArt, Map<string, SurfaceMaterials>>();
const builtMaterials = new Set<THREE.Material>();

export function tileSurfaceMaterials(
  surface: TileSurface,
  sideBudget: number,
): SurfaceMaterials {
  const byVariant = materialsByArt.get(surface.art) ?? new Map<string, SurfaceMaterials>();
  materialsByArt.set(surface.art, byVariant);
  const key = `${surface.baseColor}|${surface.glow}|${sideBudget}`;
  const cached = byVariant.get(key);
  if (cached) return cached;
  const materials = builtSurface(surface, sideBudget);
  byVariant.set(key, materials);
  return materials;
}

export function disposeSharedTileSurfaces(): void {
  for (const material of builtMaterials) {
    stopFaceArtAnimation(material);
    material.dispose();
  }
  builtMaterials.clear();
  materialsByArt = new WeakMap();
  disposeSharedFaceArtTextures();
}

function builtSurface(surface: TileSurface, sideBudget: number): SurfaceMaterials {
  const materials = cubeFaceMaterials(surface.art, surface.baseColor, sideBudget);
  glowSelfLit(materials, surface.glow, opaqueInk(surface.baseColor));
  for (const single of Array.isArray(materials) ? materials : [materials])
    builtMaterials.add(single);
  return materials;
}

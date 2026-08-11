import * as THREE from 'three';
import type { ItemDef } from '@/features/asset-library/items/itemDef';
import { disposeMaterials } from './disposeMeshResources';
import { itemGeometry, itemMaterials } from './itemMeshBuild';

export interface ItemSurface {
  geometry: THREE.BufferGeometry;
  materials: THREE.Material | THREE.Material[];
}

const surfacesByItemId = new Map<number, ItemSurface>();

export function itemSurface(item: ItemDef): ItemSurface {
  const cached = surfacesByItemId.get(item.id);
  if (cached) return cached;
  const surface = { geometry: itemGeometry(item), materials: itemMaterials(item) };
  surfacesByItemId.set(item.id, surface);
  return surface;
}

export function disposeSharedItemSurfaces(): void {
  for (const surface of surfacesByItemId.values()) {
    surface.geometry.dispose();
    disposeMaterials(surface.materials);
  }
  surfacesByItemId.clear();
}

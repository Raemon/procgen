import type * as THREE from 'three';

const geometriesByKey = new Map<string, THREE.BufferGeometry>();
const shared = new Set<THREE.BufferGeometry>();

export function rememberedSharedGeometry(
  key: string,
  build: () => THREE.BufferGeometry,
): THREE.BufferGeometry {
  const cached = geometriesByKey.get(key);
  if (cached) return cached;
  const geometry = build();
  geometriesByKey.set(key, geometry);
  shared.add(geometry);
  return geometry;
}

export function isSharedTileGeometry(geometry: THREE.BufferGeometry): boolean {
  return shared.has(geometry);
}

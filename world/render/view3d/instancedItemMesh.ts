import * as THREE from 'three';
import type { ItemSurface } from './itemSurfaces';

export interface ItemStandingPoint {
  x: number;
  y: number;
  z: number;
}

export function instancedItemMesh(
  surface: ItemSurface,
  points: readonly ItemStandingPoint[],
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(surface.geometry, surface.materials, points.length);
  points.forEach((point, index) =>
    mesh.setMatrixAt(index, new THREE.Matrix4().makeTranslation(point.x, point.y, point.z)),
  );
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

import * as THREE from 'three';
import type { ItemSurface } from './itemSurfaces';

export interface ItemStandingPoint {
  x: number;
  y: number;
  z: number;
}

const standingPlace = new THREE.Matrix4();

export function instancedItemMesh(
  surface: ItemSurface,
  points: readonly ItemStandingPoint[],
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(surface.geometry, surface.materials, points.length);
  points.forEach((point, index) =>
    mesh.setMatrixAt(index, standingPlace.makeTranslation(point.x, point.y, point.z)),
  );
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

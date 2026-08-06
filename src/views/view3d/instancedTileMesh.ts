import * as THREE from 'three';
import type { TilePlacement } from './tilePlacements';

export type PlacementPosition = (placement: TilePlacement) => [number, number, number];

export function instancedTileMesh(
  geometry: THREE.BufferGeometry,
  placements: readonly TilePlacement[],
  positionOf: PlacementPosition,
): THREE.InstancedMesh | null {
  if (placements.length === 0) {
    geometry.dispose();
    return null;
  }
  const mesh = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshLambertMaterial(),
    placements.length,
  );
  placements.forEach((placement, index) => writeInstance(mesh, index, placement, positionOf));
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function writeInstance(
  mesh: THREE.InstancedMesh,
  index: number,
  placement: TilePlacement,
  positionOf: PlacementPosition,
): void {
  const [x, y, z] = positionOf(placement);
  mesh.setMatrixAt(index, new THREE.Matrix4().makeTranslation(x, y, z));
  mesh.setColorAt(index, placement.color);
}

import * as THREE from 'three';
import { disposeMaterials } from './disposeMeshResources';
import type { TilePlacement } from './tilePlacements';

export type PlacementPosition = (placement: TilePlacement) => [number, number, number];

export function instancedTileMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  placements: readonly TilePlacement[],
  positionOf: PlacementPosition,
): THREE.InstancedMesh | null {
  if (placements.length === 0) {
    geometry.dispose();
    disposeMaterials(material);
    return null;
  }
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
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
  mesh.setColorAt(index, instanceTint(placement));
}

function instanceTint(placement: TilePlacement): THREE.Color {
  const tint = placement.faceArt
    ? new THREE.Color('#ffffff')
    : new THREE.Color(placement.baseColor);
  return tint.multiplyScalar(placement.shade);
}

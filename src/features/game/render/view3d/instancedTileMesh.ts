import * as THREE from 'three';
import { opaqueInk } from '@/features/asset-library/tiles/inkColor';
import type { TilePlacement } from './tilePlacements';

export type PlacementPosition = (placement: TilePlacement) => [number, number, number];
export type PlacementScale = (placement: TilePlacement) => [number, number, number];

const placedAt = new THREE.Matrix4();
const stretched = new THREE.Vector3();
const tint = new THREE.Color();

export function instancedTileMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  placements: readonly TilePlacement[],
  positionOf: PlacementPosition,
  scaleOf?: PlacementScale,
): THREE.InstancedMesh | null {
  if (placements.length === 0) return null;
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
  placements.forEach((placement, index) =>
    writeInstance(mesh, index, placement, positionOf, scaleOf),
  );
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function writeInstance(
  mesh: THREE.InstancedMesh,
  index: number,
  placement: TilePlacement,
  positionOf: PlacementPosition,
  scaleOf?: PlacementScale,
): void {
  const [x, y, z] = positionOf(placement);
  const [scaleX, scaleY, scaleZ] = scaleOf?.(placement) ?? [1, 1, 1];
  mesh.setMatrixAt(
    index,
    placedAt.makeTranslation(x, y, z).scale(stretched.set(scaleX, scaleY, scaleZ)),
  );
  mesh.setColorAt(index, instanceTint(placement));
}

function instanceTint(placement: TilePlacement): THREE.Color {
  tint.set(placement.faceArt ? '#ffffff' : opaqueInk(placement.baseColor));
  return tint.multiplyScalar(placement.shade);
}

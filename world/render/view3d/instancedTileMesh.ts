import * as THREE from 'three';
import { opaqueInk } from '../../../assets/tiles/inkColor';
import type { TilePlacement } from './tilePlacements';

export type PlacementPosition = (placement: TilePlacement) => [number, number, number];
export type PlacementVerticalScale = (placement: TilePlacement) => number;

export function instancedTileMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  placements: readonly TilePlacement[],
  positionOf: PlacementPosition,
  verticalScaleOf?: PlacementVerticalScale,
): THREE.InstancedMesh | null {
  if (placements.length === 0) {
    geometry.dispose();
    return null;
  }
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
  placements.forEach((placement, index) =>
    writeInstance(mesh, index, placement, positionOf, verticalScaleOf),
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
  verticalScaleOf?: PlacementVerticalScale,
): void {
  const [x, y, z] = positionOf(placement);
  const verticalScale = verticalScaleOf?.(placement) ?? 1;
  mesh.setMatrixAt(
    index,
    new THREE.Matrix4().makeTranslation(x, y, z).scale(new THREE.Vector3(1, verticalScale, 1)),
  );
  mesh.setColorAt(index, instanceTint(placement));
}

function instanceTint(placement: TilePlacement): THREE.Color {
  const tint = placement.faceArt
    ? new THREE.Color('#ffffff')
    : new THREE.Color(opaqueInk(placement.baseColor));
  return tint.multiplyScalar(placement.shade);
}

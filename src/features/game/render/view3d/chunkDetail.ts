import * as THREE from 'three';
import { tileSurfaceMaterials, type TileSurface } from './tileSurfaces';
import { pngCubeMaterials } from './pngFaceMaterials';

const DETAIL_KEY = 'tileMaterialDetail';

export type TileMaterialDetail =
  | { kind: 'faceArt'; surface: TileSurface }
  | { kind: 'png'; textureId: string; baseColor: string; glow: number };

export function rememberTileMaterialDetail(
  mesh: THREE.Mesh,
  detail: TileMaterialDetail,
): void {
  mesh.userData[DETAIL_KEY] = detail;
}

export function hasSharedMaterials(mesh: THREE.Mesh): boolean {
  return mesh.userData[DETAIL_KEY] !== undefined;
}

export function tileMaterialsAtDetail(
  detail: TileMaterialDetail,
  sideBudget: number,
): THREE.Material | THREE.Material[] {
  if (detail.kind === 'faceArt') return tileSurfaceMaterials(detail.surface, sideBudget);
  return pngCubeMaterials(detail.textureId, detail.baseColor, detail.glow, sideBudget);
}

export function applyTileSideBudget(group: THREE.Object3D, sideBudget: number): void {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) applyToMesh(object, sideBudget);
  });
}

function applyToMesh(mesh: THREE.Mesh, sideBudget: number): void {
  const detail = mesh.userData[DETAIL_KEY] as TileMaterialDetail | undefined;
  if (detail) mesh.material = tileMaterialsAtDetail(detail, sideBudget);
}

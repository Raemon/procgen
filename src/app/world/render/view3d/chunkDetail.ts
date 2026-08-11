import * as THREE from 'three';
import { tileSurfaceMaterials, type TileSurface } from './tileSurfaces';

const SURFACE_KEY = 'tileSurface';

export function rememberTileSurface(mesh: THREE.Mesh, surface: TileSurface): void {
  mesh.userData[SURFACE_KEY] = surface;
}

export function hasSharedMaterials(mesh: THREE.Mesh): boolean {
  return mesh.userData[SURFACE_KEY] !== undefined;
}

export function applyTileSideBudget(group: THREE.Object3D, sideBudget: number): void {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) applyToMesh(object, sideBudget);
  });
}

function applyToMesh(mesh: THREE.Mesh, sideBudget: number): void {
  const surface = mesh.userData[SURFACE_KEY] as TileSurface | undefined;
  if (surface) mesh.material = tileSurfaceMaterials(surface, sideBudget);
}

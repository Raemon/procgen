import * as THREE from 'three';

export function disposeMeshChildren(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child);
    if (child instanceof THREE.Mesh) disposeMeshResources(child);
  }
}

export function disposeMaterials(material: THREE.Material | THREE.Material[]): void {
  for (const single of Array.isArray(material) ? material : [material]) {
    if ('map' in single && single.map instanceof THREE.Texture) single.map.dispose();
    single.dispose();
  }
}

export function disposeMeshResources(mesh: THREE.Mesh): void {
  mesh.geometry.dispose();
  disposeMaterials(mesh.material);
}

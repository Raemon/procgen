import * as THREE from 'three';
import { faceArtFramesOf, stopFaceArtAnimation } from './faceArtAnimations';

export function disposeMeshChildren(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child);
    if (child instanceof THREE.Mesh) disposeMeshResources(child);
  }
}

export function disposeMaterials(material: THREE.Material | THREE.Material[]): void {
  for (const single of Array.isArray(material) ? material : [material]) {
    disposeTexturesOf(single);
    single.dispose();
  }
}

function disposeTexturesOf(material: THREE.Material): void {
  const frames = faceArtFramesOf(material);
  if (!frames) {
    if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose();
    return;
  }
  stopFaceArtAnimation(material);
  for (const frame of frames) {
    frame.map.dispose();
    frame.normalMap?.dispose();
  }
}

export function disposeMeshResources(
  mesh: THREE.Mesh,
  options: { keepMaterials?: boolean; keepGeometry?: boolean } = {},
): void {
  if (!options.keepGeometry) mesh.geometry.dispose();
  if (!options.keepMaterials) disposeMaterials(mesh.material);
}

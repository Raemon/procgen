import * as THREE from 'three';
import { hasSharedMaterials } from './chunkDetail';
import { faceArtFramesOf, stopFaceArtAnimation } from './faceArtAnimations';
import { isSharedFaceArtTexture } from './faceArtTextures';

export function disposeMeshChildren(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child);
    if (child instanceof THREE.Group) disposeMeshChildren(child);
    if (child instanceof THREE.Mesh)
      disposeMeshResources(child, { keepMaterials: hasSharedMaterials(child) });
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
    if ('map' in material && material.map instanceof THREE.Texture) disposeTexture(material.map);
    return;
  }
  stopFaceArtAnimation(material);
  for (const frame of frames) {
    disposeTexture(frame.map);
    if (frame.normalMap) disposeTexture(frame.normalMap);
  }
}

function disposeTexture(texture: THREE.Texture): void {
  if (!isSharedFaceArtTexture(texture)) texture.dispose();
}

export function disposeMeshResources(
  mesh: THREE.Mesh,
  options: { keepMaterials?: boolean; keepGeometry?: boolean } = {},
): void {
  if (!options.keepGeometry) mesh.geometry.dispose();
  if (!options.keepMaterials) disposeMaterials(mesh.material);
}

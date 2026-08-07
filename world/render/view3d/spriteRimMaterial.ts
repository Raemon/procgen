import * as THREE from 'three';

const UNTINTED = 0xffffff;

export function spriteRimMaterial(tint: number = UNTINTED): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color: tint,
    vertexColors: true,
    side: THREE.DoubleSide,
  });
}

import * as THREE from 'three';

const UNTINTED = 0xffffff;

/**
 * The extruded silhouette walls, which carry their colour per vertex because every
 * run of the outline is shaded from the sprite pixel it was cut from.
 */
export function spriteRimMaterial(tint: number = UNTINTED): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color: tint,
    vertexColors: true,
    side: THREE.DoubleSide,
  });
}

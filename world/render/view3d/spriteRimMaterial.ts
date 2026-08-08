import * as THREE from 'three';
import { emissiveFollowsVertexColor } from './vertexColorEmissive';

const UNTINTED = 0xffffff;

export function spriteRimMaterial(tint: number = UNTINTED): THREE.MeshLambertMaterial {
  const material = new THREE.MeshLambertMaterial({
    color: tint,
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  emissiveFollowsVertexColor(material);
  return material;
}

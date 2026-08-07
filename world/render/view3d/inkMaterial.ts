import * as THREE from 'three';
import { isTransparentInk, opaqueInk } from '../../../library/tiles/inkColor';

export function lambertFromInk(ink: string): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color: opaqueInk(ink),
    transparent: isTransparentInk(ink),
    opacity: isTransparentInk(ink) ? 0 : 1,
  });
}

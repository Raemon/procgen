import * as THREE from 'three';

const PLAYER_INK = 0xffd86a;

export function createPlayerCapsule(ink: number = PLAYER_INK): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CapsuleGeometry(0.3, 0.5, 4, 12),
    new THREE.MeshLambertMaterial({ color: ink }),
  );
}

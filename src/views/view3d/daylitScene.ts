import * as THREE from 'three';
import {
  CHARACTER_HAZE_START_TILES,
  CHARACTER_SIGHT_RADIUS_TILES,
} from '../../world/vision/characterSight';

export const SKY_INK = '#0a0d13';
const PLAYER_INK = 0xffd86a;

export function createDaylitScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_INK);
  scene.add(new THREE.AmbientLight(0xbfd0e0, 0.55));
  scene.add(sunlight());
  return scene;
}

export function createCharacterFog(): THREE.Fog {
  return new THREE.Fog(SKY_INK, CHARACTER_HAZE_START_TILES, CHARACTER_SIGHT_RADIUS_TILES);
}

export function createPlayerMesh(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CapsuleGeometry(0.3, 0.5, 4, 12),
    new THREE.MeshLambertMaterial({ color: PLAYER_INK }),
  );
}

function sunlight(): THREE.DirectionalLight {
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.6);
  sun.position.set(40, 60, 25);
  return sun;
}

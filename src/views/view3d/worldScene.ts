import * as THREE from 'three';
import {
  CHARACTER_HAZE_START_TILES,
  CHARACTER_SIGHT_RADIUS_TILES,
} from '../../world/vision/characterSight';

export const SKY_INK = '#0a0d13';

export function createWorldScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_INK);
  return scene;
}

export function createCharacterFog(): THREE.Fog {
  return new THREE.Fog(SKY_INK, CHARACTER_HAZE_START_TILES, CHARACTER_SIGHT_RADIUS_TILES);
}

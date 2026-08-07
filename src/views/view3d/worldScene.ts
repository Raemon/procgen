import * as THREE from 'three';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  hazeStartTiles,
} from '../../world/vision/characterSight';

export const SKY_INK = '#0a0d13';

export function createWorldScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_INK);
  return scene;
}

export function createCharacterFog(
  sightRadiusTiles: number = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
): THREE.Fog {
  return new THREE.Fog(SKY_INK, hazeStartTiles(sightRadiusTiles), sightRadiusTiles);
}

export function setFogRange(fog: THREE.Fog, sightRadiusTiles: number): void {
  fog.near = hazeStartTiles(sightRadiusTiles);
  fog.far = sightRadiusTiles;
}

import * as THREE from 'three';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  hazeStartTiles,
} from '../../vision/characterSight';
import { skyInkFor } from './skyInk';

export function createWorldScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = skyInkFor(0);
  return scene;
}

export function createCharacterFog(
  sightRadiusTiles: number = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
): THREE.Fog {
  return new THREE.Fog(skyInkFor(0), hazeStartTiles(sightRadiusTiles), sightRadiusTiles);
}

export function setFogRange(fog: THREE.Fog, sightRadiusTiles: number): void {
  fog.near = hazeStartTiles(sightRadiusTiles);
  fog.far = sightRadiusTiles;
}

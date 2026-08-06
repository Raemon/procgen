import * as THREE from 'three';
import { fogDistancesFromCamera } from '../../world/vision/characterSight';
import { SKY_INK } from './daylitScene';

export class CharacterFog {
  readonly fog = new THREE.Fog(SKY_INK, 1, 2);

  settleAroundPlayer(cameraDistanceToPlayer: number): void {
    const distances = fogDistancesFromCamera(cameraDistanceToPlayer);
    this.fog.near = distances.haze;
    this.fog.far = distances.opaque;
  }

  opaqueDistance(): number {
    return this.fog.far;
  }
}

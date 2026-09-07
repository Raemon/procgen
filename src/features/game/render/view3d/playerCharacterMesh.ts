import * as THREE from 'three';
import type { CharacterMotion } from '@/features/asset-library/characters/characterFrame';
import { lanternLightSource } from '../../light/lanternLight';
import type { LightSource } from '../../light/lightEmission';
import type { CameraView } from './cameraView';
import { LanternCube } from './lanternCube';
import { LANTERN_CENTER_HEIGHT, LANTERN_INK } from './lanternCubeParts';

const TILE_CENTER = 0.5;

export interface PlayerStance {
  x: number;
  y: number;
  elevation: number;
  motion: CharacterMotion;
}

export class PlayerCharacterMesh {
  readonly object = new THREE.Group();

  private readonly lantern: LanternCube;
  private readonly ink: number;

  constructor(tint?: number) {
    this.ink = tint ?? LANTERN_INK;
    this.lantern = new LanternCube(this.ink);
    this.object.add(this.lantern.object);
  }

  dispose(): void {
    this.object.removeFromParent();
    this.lantern.dispose();
  }

  set visible(visible: boolean) {
    this.object.visible = visible;
  }

  get position(): THREE.Vector3 {
    return this.object.position;
  }

  standAt(stance: PlayerStance, view: CameraView): void {
    this.object.position.set(stance.x, stance.elevation + LANTERN_CENTER_HEIGHT, stance.y);
    this.lantern.pose(stance.motion, view.seconds);
  }

  lightSource(): LightSource {
    const { x, y, z } = this.object.position;
    return lanternLightSource(x - TILE_CENTER, z - TILE_CENTER, y, this.ink);
  }
}

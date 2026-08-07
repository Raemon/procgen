import * as THREE from 'three';
import type { LightSource } from '../../world/light/lightEmission';

const LIGHT_INTENSITY_PER_TILE = 1.4;

export class PointLightPool {
  private readonly lights: THREE.PointLight[] = [];
  private readonly group = new THREE.Group();

  constructor(root: THREE.Object3D, capacity: number) {
    root.add(this.group);
    for (let index = 0; index < capacity; index++) this.addLight();
  }

  dispose(): void {
    for (const light of this.lights) light.dispose();
    this.group.removeFromParent();
  }

  show(sources: readonly LightSource[]): void {
    this.lights.forEach((light, index) => dressLight(light, sources[index]));
  }

  get capacity(): number {
    return this.lights.length;
  }

  private addLight(): void {
    const light = new THREE.PointLight(0xffffff, 0, 1);
    light.visible = false;
    this.lights.push(light);
    this.group.add(light);
  }
}

function dressLight(light: THREE.PointLight, source: LightSource | undefined): void {
  light.visible = source !== undefined;
  if (!source) return;
  light.color.set(source.ink);
  light.distance = source.radius;
  light.intensity = source.radius * LIGHT_INTENSITY_PER_TILE;
  light.position.set(source.x + 0.5, source.elevation, source.y + 0.5);
}

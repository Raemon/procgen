import * as THREE from 'three';
import { skyInkFor } from './skyInk';

const FULL_AMBIENT_INTENSITY = 0.55;
const FULL_SUN_INTENSITY = 1.6;

export const LAMPLIT_AMBIENT = 0.02;
export const OVERHEAD_AMBIENT = 0.4;

export class SceneDaylight {
  private readonly ambient = new THREE.AmbientLight(0xbfd0e0, FULL_AMBIENT_INTENSITY);
  private readonly sun = sunlight();

  constructor(
    private readonly scene: THREE.Scene,
    private unlitAmbient = LAMPLIT_AMBIENT,
  ) {
    scene.add(this.ambient, this.sun);
  }

  seeInTheDark(unlitAmbient: number): void {
    this.unlitAmbient = unlitAmbient;
  }

  setLevel(daylight: number): void {
    const level = Math.max(0, Math.min(1, daylight));
    this.ambient.intensity = this.unlitAmbient + level * FULL_AMBIENT_INTENSITY;
    this.sun.intensity = level * FULL_SUN_INTENSITY;
    this.sun.visible = level > 0;
    this.paintTheSky(level);
  }

  private paintTheSky(level: number): void {
    const ink = skyInkFor(level);
    this.scene.background = ink;
    if (this.scene.fog) this.scene.fog.color = ink;
  }
}

function sunlight(): THREE.DirectionalLight {
  const sun = new THREE.DirectionalLight(0xfff2d8, FULL_SUN_INTENSITY);
  sun.position.set(40, 60, 25);
  return sun;
}

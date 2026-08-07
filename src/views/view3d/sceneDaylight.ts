import * as THREE from 'three';

const FULL_AMBIENT_INTENSITY = 0.55;
const FULL_SUN_INTENSITY = 1.6;
const UNLIT_AMBIENT_INTENSITY = 0.02;

export class SceneDaylight {
  private readonly ambient = new THREE.AmbientLight(0xbfd0e0, FULL_AMBIENT_INTENSITY);
  private readonly sun = sunlight();

  constructor(scene: THREE.Scene) {
    scene.add(this.ambient, this.sun);
  }

  setLevel(daylight: number): void {
    const level = Math.max(0, Math.min(1, daylight));
    this.ambient.intensity = UNLIT_AMBIENT_INTENSITY + level * FULL_AMBIENT_INTENSITY;
    this.sun.intensity = level * FULL_SUN_INTENSITY;
    this.sun.visible = level > 0;
  }
}

function sunlight(): THREE.DirectionalLight {
  const sun = new THREE.DirectionalLight(0xfff2d8, FULL_SUN_INTENSITY);
  sun.position.set(40, 60, 25);
  return sun;
}

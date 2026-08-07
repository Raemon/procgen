import * as THREE from 'three';
import { clampLightRadius, type LightEmitter } from '../../light/lightEmission';

const FULLY_GLOWING_RADIUS = 8;
const FAINTEST_GLOW = 0.4;

export function glowOfEmitter(emitter: LightEmitter | null | undefined): number {
  const radius = emitter ? clampLightRadius(emitter.light) : 0;
  if (radius <= 0) return 0;
  return Math.max(FAINTEST_GLOW, Math.min(1, radius / FULLY_GLOWING_RADIUS));
}

/**
 * A surface that emits light stands inside its own point light, where no face
 * can catch it, so it has to light itself or it renders as a black cut-out.
 */
export function glowSelfLit(
  material: THREE.Material | THREE.Material[],
  glow: number,
  untexturedInk?: string,
): void {
  if (glow <= 0) return;
  for (const single of Array.isArray(material) ? material : [material])
    selfLight(single, glow, untexturedInk);
}

function selfLight(material: THREE.Material, glow: number, untexturedInk?: string): void {
  if (!(material instanceof THREE.MeshLambertMaterial)) return;
  material.emissive = new THREE.Color(material.map ? 0xffffff : untexturedInk ?? material.color);
  material.emissiveMap = material.map;
  material.emissiveIntensity = glow;
}

import * as THREE from 'three';

const NIGHT_INK = '#0a0d13';
const DAY_INK = '#8fb4d6';

export function skyInkFor(daylight: number): THREE.Color {
  const level = Math.max(0, Math.min(1, daylight));
  return new THREE.Color(NIGHT_INK).lerp(new THREE.Color(DAY_INK), level);
}

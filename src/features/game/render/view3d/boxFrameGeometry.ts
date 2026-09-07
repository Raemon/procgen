import * as THREE from 'three';
import { mergedGeometry } from './mergedGeometry';

export function boxFrameGeometry(size: number, barThickness: number): THREE.BufferGeometry {
  const offset = (size - barThickness) / 2;
  const bars: THREE.BufferGeometry[] = [];
  for (const first of [-offset, offset]) {
    for (const second of [-offset, offset]) {
      bars.push(barAt(size, barThickness, barThickness, 0, first, second));
      bars.push(barAt(barThickness, size, barThickness, first, 0, second));
      bars.push(barAt(barThickness, barThickness, size, first, second, 0));
    }
  }
  return mergedGeometry(bars);
}

function barAt(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
): THREE.BufferGeometry {
  const bar = new THREE.BoxGeometry(width, height, depth);
  bar.translate(x, y, z);
  return bar;
}

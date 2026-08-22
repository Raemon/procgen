import * as THREE from 'three';

export interface ShotSize {
  width: number;
  height: number;
}

let shared: THREE.WebGLRenderer | null = null;

export function shotRenderer(size: ShotSize): THREE.WebGLRenderer {
  shared ??= new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  shared.setPixelRatio(1);
  shared.setSize(size.width, size.height, false);
  return shared;
}

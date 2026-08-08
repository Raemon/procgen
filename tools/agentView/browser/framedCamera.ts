import type * as THREE from 'three';

export interface FramedCamera {
  camera: THREE.PerspectiveCamera;
  update(): void;
  focusPoint(): { x: number; y: number };
  visibleRadiusTiles(): number;
  fogSightRadiusTiles(): number | null;
}

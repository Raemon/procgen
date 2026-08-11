import * as THREE from 'three';
import type { CaptureCell } from '../../capture/captureTool';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();

export function worldCellUnderPointer(
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  offsetX: number,
  offsetY: number,
  planeHeight: number,
): CaptureCell | null {
  pointer.set(
    (offsetX / canvas.clientWidth) * 2 - 1,
    -(offsetY / canvas.clientHeight) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  groundPlane.constant = -planeHeight;
  if (!raycaster.ray.intersectPlane(groundPlane, hit)) return null;
  return { x: Math.floor(hit.x), y: Math.floor(hit.z) };
}

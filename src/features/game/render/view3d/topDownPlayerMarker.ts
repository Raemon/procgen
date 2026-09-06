import * as THREE from 'three';
import { disposeMeshResources } from './disposeMeshResources';

const MARKER_INK = 0xffd86a;
const MARKER_RADIUS = 0.26;
const LIFT_ABOVE_HEAD = 0.45;

export class TopDownPlayerMarker {
  private readonly mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(MARKER_RADIUS),
    new THREE.MeshBasicMaterial({ color: MARKER_INK }),
  );

  constructor(parent: THREE.Object3D) {
    this.mesh.visible = false;
    parent.add(this.mesh);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    disposeMeshResources(this.mesh);
  }

  hide(): void {
    this.mesh.visible = false;
  }

  hoverOver(head: THREE.Vector3): void {
    this.mesh.visible = true;
    this.mesh.position.set(head.x, head.y + LIFT_ABOVE_HEAD, head.z);
  }
}

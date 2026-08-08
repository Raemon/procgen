import * as THREE from 'three';
import type { WorldRegion } from '../../../assets/prefabs/captureRegionAsPrefab';

const SELECTION_INK = 0xffd86a;
const BOX_HEIGHT = 4;

export class SelectionBox {
  private readonly lines: THREE.LineSegments;

  constructor(root: THREE.Group) {
    this.lines = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, BOX_HEIGHT, 1)),
      new THREE.LineBasicMaterial({ color: SELECTION_INK }),
    );
    this.lines.visible = false;
    root.add(this.lines);
  }

  dispose(): void {
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
  }

  showRegion(region: WorldRegion | null, groundHeight: number): void {
    this.lines.visible = region !== null;
    if (!region) return;
    const width = region.maxX - region.minX + 1;
    const depth = region.maxY - region.minY + 1;
    this.lines.scale.set(width, 1, depth);
    this.lines.position.set(
      region.minX + width / 2,
      groundHeight + BOX_HEIGHT / 2,
      region.minY + depth / 2,
    );
  }
}

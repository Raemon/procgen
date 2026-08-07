import * as THREE from 'three';

export interface Quad {
  corners: readonly (readonly number[])[];
  normal: readonly number[];
  uvs: readonly (readonly number[])[];
  color: THREE.Color;
}

const TRIANGULATED_CORNERS = [0, 1, 2, 0, 2, 3];

export class QuadBuffer {
  private readonly positions: number[] = [];
  private readonly normals: number[] = [];
  private readonly uvs: number[] = [];
  private readonly colors: number[] = [];
  private readonly groups: { start: number; count: number; materialIndex: number }[] = [];
  private closedVertices = 0;

  push(quad: Quad): void {
    for (const corner of TRIANGULATED_CORNERS) this.pushVertex(quad, corner);
  }

  closeGroup(materialIndex: number): void {
    const count = this.positions.length / 3 - this.closedVertices;
    if (count > 0) this.groups.push({ start: this.closedVertices, count, materialIndex });
    this.closedVertices += count;
  }

  geometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    for (const group of this.groups) geometry.addGroup(group.start, group.count, group.materialIndex);
    return geometry;
  }

  private pushVertex(quad: Quad, corner: number): void {
    this.positions.push(...quad.corners[corner]!);
    this.normals.push(...quad.normal);
    this.uvs.push(...quad.uvs[corner]!);
    this.colors.push(quad.color.r, quad.color.g, quad.color.b);
  }
}

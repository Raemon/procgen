import * as THREE from 'three';
import { tileBoxGeometry } from '../tileBoxGeometry';
import { pushCorner, type FaceBucket } from './faceBuckets';

export interface PositionedBox {
  width: number;
  height: number;
  depth: number;
  x: number;
  y: number;
  z: number;
  yaw?: number;
}

export function addBoxToFaceBuckets(buckets: FaceBucket[], box: PositionedBox): void {
  const geometry = placedBoxGeometry(box);
  const index = geometry.getIndex()!;
  for (const group of geometry.groups) {
    appendGroupCorners(buckets[group.materialIndex!]!, geometry, index, group);
  }
}

function placedBoxGeometry(box: PositionedBox): THREE.BoxGeometry {
  const geometry = tileBoxGeometry(box.width, box.height, box.depth);
  if (box.yaw) geometry.rotateY(box.yaw);
  geometry.translate(box.x, box.y, box.z);
  return geometry;
}

function appendGroupCorners(
  bucket: FaceBucket,
  geometry: THREE.BoxGeometry,
  index: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  group: THREE.GeometryGroup,
): void {
  for (let corner = 0; corner < group.count; corner++) {
    pushCorner(bucket, cornerAt(geometry, index.getX(group.start + corner)));
  }
}

function cornerAt(geometry: THREE.BoxGeometry, vertex: number) {
  const { position, normal, uv } = geometry.attributes;
  return {
    position: [position!.getX(vertex), position!.getY(vertex), position!.getZ(vertex)] as const,
    normal: [normal!.getX(vertex), normal!.getY(vertex), normal!.getZ(vertex)] as const,
    uv: [uv!.getX(vertex), uv!.getY(vertex)] as const,
  };
}

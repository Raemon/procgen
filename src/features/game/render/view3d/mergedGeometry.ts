import * as THREE from 'three';

export function mergedGeometry(parts: readonly THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  for (const part of parts) {
    const flat = part.index ? part.toNonIndexed() : part;
    appendTo(positions, flat.getAttribute('position'));
    appendTo(normals, flat.getAttribute('normal'));
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return merged;
}

function appendTo(
  values: number[],
  attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
): void {
  for (let index = 0; index < attribute.count; index++) {
    values.push(attribute.getX(index), attribute.getY(index), attribute.getZ(index));
  }
}

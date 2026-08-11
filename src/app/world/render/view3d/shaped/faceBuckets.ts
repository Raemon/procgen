import * as THREE from 'three';

export interface FaceBucket {
  position: number[];
  normal: number[];
  uv: number[];
}

export interface FaceCorner {
  position: readonly [number, number, number];
  normal: readonly [number, number, number];
  uv: readonly [number, number];
}

const CUBE_FACE_COUNT = 6;

export function emptyFaceBuckets(): FaceBucket[] {
  return Array.from({ length: CUBE_FACE_COUNT }, () => ({ position: [], normal: [], uv: [] }));
}

export function pushCorner(bucket: FaceBucket, corner: FaceCorner): void {
  bucket.position.push(...corner.position);
  bucket.normal.push(...corner.normal);
  bucket.uv.push(...corner.uv);
}

export function pushQuad(bucket: FaceBucket, corners: readonly FaceCorner[]): void {
  for (const index of [0, 1, 2, 0, 2, 3]) pushCorner(bucket, corners[index]!);
}

export function pushTriangle(bucket: FaceBucket, corners: readonly FaceCorner[]): void {
  for (const corner of corners) pushCorner(bucket, corner);
}

export function geometryOfFaceBuckets(
  buckets: readonly FaceBucket[],
  faces: number,
): THREE.BufferGeometry {
  const kept = buckets.map((bucket, face) => ((faces & (1 << face)) === 0 ? null : bucket));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', attributeOf(kept, (bucket) => bucket.position, 3));
  geometry.setAttribute('normal', attributeOf(kept, (bucket) => bucket.normal, 3));
  geometry.setAttribute('uv', attributeOf(kept, (bucket) => bucket.uv, 2));
  addFaceGroups(geometry, kept);
  return geometry;
}

function attributeOf(
  kept: readonly (FaceBucket | null)[],
  read: (bucket: FaceBucket) => number[],
  itemSize: number,
): THREE.BufferAttribute {
  const values = kept.flatMap((bucket) => (bucket ? read(bucket) : []));
  return new THREE.BufferAttribute(new Float32Array(values), itemSize);
}

function addFaceGroups(geometry: THREE.BufferGeometry, kept: readonly (FaceBucket | null)[]): void {
  let start = 0;
  kept.forEach((bucket, face) => {
    const count = bucket ? bucket.position.length / 3 : 0;
    if (count > 0) geometry.addGroup(start, count, face);
    start += count;
  });
}

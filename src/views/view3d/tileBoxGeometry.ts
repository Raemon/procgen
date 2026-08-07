import * as THREE from 'three';

interface FaceUvWindow {
  uSpan: number;
  vSpan: number;
  anchorVAtTop: boolean;
}

const VERTICES_PER_FACE = 4;
const BOX_FACE_COUNT = 6;

/** Sides keep the top of their texture, the part of the volume the surface belongs to. */
export function tileBoxGeometry(width: number, height: number, depth: number): THREE.BoxGeometry {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  faceUvWindows(width, height, depth).forEach((window, face) =>
    fitFaceUvs(geometry, face, window),
  );
  return geometry;
}

function faceUvWindows(width: number, height: number, depth: number): FaceUvWindow[] {
  const eastWest = { uSpan: depth, vSpan: height, anchorVAtTop: true };
  const northSouth = { uSpan: width, vSpan: height, anchorVAtTop: true };
  const topBottom = { uSpan: width, vSpan: depth, anchorVAtTop: false };
  return [eastWest, eastWest, topBottom, topBottom, northSouth, northSouth];
}

function fitFaceUvs(geometry: THREE.BoxGeometry, face: number, window: FaceUvWindow): void {
  if (face >= BOX_FACE_COUNT) return;
  const uv = geometry.attributes.uv as THREE.BufferAttribute;
  for (let corner = 0; corner < VERTICES_PER_FACE; corner++) {
    const vertex = face * VERTICES_PER_FACE + corner;
    uv.setXY(
      vertex,
      centeredSpan(uv.getX(vertex), window.uSpan),
      window.anchorVAtTop
        ? topAnchoredSpan(uv.getY(vertex), window.vSpan)
        : centeredSpan(uv.getY(vertex), window.vSpan),
    );
  }
  uv.needsUpdate = true;
}

function centeredSpan(coordinate: number, span: number): number {
  return 0.5 + (coordinate - 0.5) * span;
}

function topAnchoredSpan(coordinate: number, span: number): number {
  return 1 - span + coordinate * span;
}

import * as THREE from 'three';
import { boxFrameGeometry } from './boxFrameGeometry';
import { mergedGeometry } from './mergedGeometry';

export const LANTERN_BODY = 0.62;
export const LANTERN_CENTER_HEIGHT = 0.52;
export const LANTERN_INK = 0xffcf7a;

const CASING_INK = 0x2b2018;
const FRAME_INK = 0x40301f;
const EYE_INK = 0x14100c;

export interface LanternParts {
  meshes: THREE.Mesh[];
  core: THREE.Mesh;
  glass: THREE.Mesh;
  lens: THREE.Mesh;
}

export function lanternParts(ink: number): LanternParts {
  const glow = new THREE.Color(ink);
  const beam = glow.clone().lerp(new THREE.Color(0xffffff), 0.28);
  const core = coreMesh(glow);
  const glass = glassMesh(glow);
  const lens = lensMesh(beam);
  return { meshes: [casingMesh(glow), frameMesh(glow), core, glass, lens, eyeMesh()], core, glass, lens };
}

function frameMesh(glow: THREE.Color): THREE.Mesh {
  return new THREE.Mesh(
    boxFrameGeometry(LANTERN_BODY, LANTERN_BODY * 0.15),
    new THREE.MeshLambertMaterial({ color: FRAME_INK, emissive: glow, emissiveIntensity: 0.14 }),
  );
}

function casingMesh(glow: THREE.Color): THREE.Mesh {
  const hood = box(LANTERN_BODY * 0.82, LANTERN_BODY * 0.11, LANTERN_BODY * 0.82, 0, LANTERN_BODY * 0.55, 0);
  const brim = box(LANTERN_BODY * 0.4, LANTERN_BODY * 0.07, LANTERN_BODY * 0.3, 0, LANTERN_BODY * 0.55, -LANTERN_BODY * 0.58);
  const base = box(LANTERN_BODY * 1.06, LANTERN_BODY * 0.11, LANTERN_BODY * 1.06, 0, -LANTERN_BODY * 0.56, 0);
  return new THREE.Mesh(
    mergedGeometry([hood, brim, base]),
    new THREE.MeshLambertMaterial({ color: CASING_INK, emissive: glow, emissiveIntensity: 0.1 }),
  );
}

function coreMesh(glow: THREE.Color): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(LANTERN_BODY * 0.58, LANTERN_BODY * 0.68, LANTERN_BODY * 0.58),
    new THREE.MeshLambertMaterial({ color: glow, emissive: glow, emissiveIntensity: 1 }),
  );
}

function glassMesh(glow: THREE.Color): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(LANTERN_BODY * 0.92, LANTERN_BODY * 0.92, LANTERN_BODY * 0.92),
    new THREE.MeshLambertMaterial({
      color: glow,
      emissive: glow,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  mesh.renderOrder = 1;
  return mesh;
}

function lensMesh(beam: THREE.Color): THREE.Mesh {
  const shutter = box(LANTERN_BODY * 0.5, LANTERN_BODY * 0.16, LANTERN_BODY * 0.07, 0, -LANTERN_BODY * 0.22, -LANTERN_BODY * 0.5);
  const vent = box(LANTERN_BODY * 0.34, LANTERN_BODY * 0.06, LANTERN_BODY * 0.34, 0, LANTERN_BODY * 0.6, -LANTERN_BODY * 0.24);
  return new THREE.Mesh(
    mergedGeometry([shutter, vent]),
    new THREE.MeshLambertMaterial({ color: beam, emissive: beam, emissiveIntensity: 1.0 }),
  );
}

function eyeMesh(): THREE.Mesh {
  const width = LANTERN_BODY * 0.18;
  const height = LANTERN_BODY * 0.16;
  const apart = LANTERN_BODY * 0.21;
  const brow = LANTERN_BODY * 0.06;
  const front = -LANTERN_BODY * 0.49;
  return new THREE.Mesh(
    mergedGeometry([
      box(width, height, LANTERN_BODY * 0.09, -apart, brow, front),
      box(width, height, LANTERN_BODY * 0.09, apart, brow, front),
    ]),
    new THREE.MeshLambertMaterial({ color: EYE_INK }),
  );
}

function box(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  geometry.translate(x, y, z);
  return geometry;
}

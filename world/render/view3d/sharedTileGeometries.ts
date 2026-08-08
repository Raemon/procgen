import * as THREE from 'three';
import { tileBoxGeometry } from './tileBoxGeometry';
import { EVERY_FACE } from './culling/visibleFaceMask';
import { rememberedSharedGeometry } from './sharedGeometryCache';

interface FaceSelection {
  indices: number[];
  groups: THREE.GeometryGroup[];
}

export { isSharedTileGeometry } from './sharedGeometryCache';

export function sharedTileBoxGeometry(
  width: number,
  height: number,
  depth: number,
  faces: number,
): THREE.BufferGeometry {
  return rememberedSharedGeometry(`box:${width}:${height}:${depth}:${faces}`, () =>
    boxWithOnlyTheseFaces(tileBoxGeometry(width, height, depth), faces),
  );
}

function boxWithOnlyTheseFaces(box: THREE.BoxGeometry, faces: number): THREE.BufferGeometry {
  if (faces === EVERY_FACE) return box;
  const selection = selectedFaces(box, faces);
  const kept = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) kept.setAttribute(name, box.attributes[name]!);
  kept.setIndex(selection.indices);
  for (const group of selection.groups) kept.addGroup(group.start, group.count, group.materialIndex);
  return kept;
}

function selectedFaces(box: THREE.BoxGeometry, faces: number): FaceSelection {
  const index = box.getIndex()!;
  const selection: FaceSelection = { indices: [], groups: [] };
  for (const group of box.groups) {
    if ((faces & (1 << group.materialIndex!)) === 0) continue;
    selection.groups.push({ ...group, start: selection.indices.length });
    for (let corner = 0; corner < group.count; corner++) {
      selection.indices.push(index.getX(group.start + corner));
    }
  }
  return selection;
}

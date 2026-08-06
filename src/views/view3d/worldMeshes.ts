import * as THREE from 'three';
import type { Grid } from '../../world/grid';
import type { Tileset } from '../../world/tiles/tileset';
import { instancedTileMesh } from './instancedTileMesh';
import { tilePlacementsByShape } from './tilePlacements';

const FLOOR_THICKNESS = 0.1;
const WATER_DROP = 0.22;
const BLOCK_HEIGHT = 1;
const TREE_HEIGHT = 1.4;

export function buildWorldMeshes(grid: Grid, tileset: Tileset): THREE.InstancedMesh[] {
  const { floors, blocks, trees } = tilePlacementsByShape(grid, tileset);
  return [
    instancedTileMesh(new THREE.BoxGeometry(1, FLOOR_THICKNESS, 1), floors, (p) => [
      p.x + 0.5,
      (p.sunkenAsWater ? -WATER_DROP : 0) - FLOOR_THICKNESS / 2,
      p.y + 0.5,
    ]),
    instancedTileMesh(new THREE.BoxGeometry(0.95, BLOCK_HEIGHT, 0.95), blocks, (p) => [
      p.x + 0.5,
      BLOCK_HEIGHT / 2,
      p.y + 0.5,
    ]),
    instancedTileMesh(new THREE.ConeGeometry(0.42, TREE_HEIGHT, 7), trees, (p) => [
      p.x + 0.5,
      TREE_HEIGHT / 2,
      p.y + 0.5,
    ]),
  ].filter((mesh): mesh is THREE.InstancedMesh => mesh !== null);
}

export function disposeMeshChildren(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child);
    if (child instanceof THREE.Mesh) disposeMesh(child);
  }
}

function disposeMesh(mesh: THREE.Mesh): void {
  mesh.geometry.dispose();
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) material.dispose();
}

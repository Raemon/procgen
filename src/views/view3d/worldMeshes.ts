import * as THREE from 'three';
import type { Grid } from '../../world/grid';
import type { CubeFaceArt } from '../../world/tiles/tileFaceArt';
import type { Tileset } from '../../world/tiles/tileset';
import { cubeFaceMaterials, sideFaceMaterial } from './faceArtMaterials';
import { instancedTileMesh, type PlacementPosition } from './instancedTileMesh';
import { tilePlacementsByShape, type TilePlacement } from './tilePlacements';

export { disposeMeshChildren } from './disposeMeshResources';

const FLOOR_THICKNESS = 0.1;
const WATER_DROP = 0.22;
const BLOCK_HEIGHT = 1;
const TREE_HEIGHT = 1.4;

interface ShapeSpec {
  geometry(): THREE.BufferGeometry;
  artMaterials(art: CubeFaceArt, baseColor: string): THREE.Material | THREE.Material[];
  positionOf: PlacementPosition;
}

interface FaceArtGroup {
  art: CubeFaceArt;
  baseColor: string;
  placements: TilePlacement[];
}

export function buildWorldMeshes(grid: Grid, tileset: Tileset): THREE.InstancedMesh[] {
  const { floors, blocks, trees } = tilePlacementsByShape(grid, tileset);
  return [
    ...meshesForShape(floors, floorShape()),
    ...meshesForShape(blocks, blockShape()),
    ...meshesForShape(trees, treeShape()),
  ];
}

function floorShape(): ShapeSpec {
  return {
    geometry: () => new THREE.BoxGeometry(1, FLOOR_THICKNESS, 1),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [
      p.x + 0.5,
      (p.sunkenAsWater ? -WATER_DROP : 0) - FLOOR_THICKNESS / 2,
      p.y + 0.5,
    ],
  };
}

function blockShape(): ShapeSpec {
  return {
    geometry: () => new THREE.BoxGeometry(0.95, BLOCK_HEIGHT, 0.95),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [p.x + 0.5, BLOCK_HEIGHT / 2, p.y + 0.5],
  };
}

function treeShape(): ShapeSpec {
  return {
    geometry: () => new THREE.ConeGeometry(0.42, TREE_HEIGHT, 7),
    artMaterials: sideFaceMaterial,
    positionOf: (p) => [p.x + 0.5, TREE_HEIGHT / 2, p.y + 0.5],
  };
}

function meshesForShape(placements: TilePlacement[], shape: ShapeSpec): THREE.InstancedMesh[] {
  const { flat, artGroups } = splitByFaceArt(placements);
  const meshes = [
    instancedTileMesh(shape.geometry(), new THREE.MeshLambertMaterial(), flat, shape.positionOf),
    ...artGroups.map((group) => artGroupMesh(group, shape)),
  ];
  return meshes.filter((mesh): mesh is THREE.InstancedMesh => mesh !== null);
}

function artGroupMesh(group: FaceArtGroup, shape: ShapeSpec): THREE.InstancedMesh | null {
  return instancedTileMesh(
    shape.geometry(),
    shape.artMaterials(group.art, group.baseColor),
    group.placements,
    shape.positionOf,
  );
}

function splitByFaceArt(placements: TilePlacement[]): {
  flat: TilePlacement[];
  artGroups: FaceArtGroup[];
} {
  const flat: TilePlacement[] = [];
  const groups = new Map<CubeFaceArt, FaceArtGroup>();
  for (const placement of placements) {
    if (placement.faceArt) addToArtGroup(groups, placement, placement.faceArt);
    else flat.push(placement);
  }
  return { flat, artGroups: [...groups.values()] };
}

function addToArtGroup(
  groups: Map<CubeFaceArt, FaceArtGroup>,
  placement: TilePlacement,
  art: CubeFaceArt,
): void {
  const group = groups.get(art) ?? { art, baseColor: placement.baseColor, placements: [] };
  groups.set(art, group);
  group.placements.push(placement);
}

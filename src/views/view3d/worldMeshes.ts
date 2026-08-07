import * as THREE from 'three';
import { CHUNK_SIZE, chunkOrigin } from '../../procgen/chunk';
import type { WorldSampler } from '../../procgen/worldSampler';
import { isTransparentInk } from '../../world/tiles/inkColor';
import type { CubeFaceArt } from '../../world/tiles/tileFaceArt';
import type { ReadOnlyTileset } from '../../app/readOnlyLibraries';
import { cubeFaceMaterials, sideFaceMaterial } from './faceArtMaterials';
import {
  instancedTileMesh,
  type PlacementPosition,
  type PlacementVerticalScale,
} from './instancedTileMesh';
import { ceilingPlacementsForRect } from './ceilingPlacements';
import { markerPlacementsForRect } from './markerPlacements';
import { tilePlacementsForRect, type TilePlacement } from './tilePlacements';
import { voxelPlacementsForRect } from './voxelPlacements';

export { disposeMeshChildren } from './disposeMeshResources';

const FLOOR_THICKNESS = 0.1;
const WATER_DROP = 0.22;
const BLOCK_LAYER_HEIGHT = 1;
const MARKER_HEIGHT = 0.7;
export const CEILING_GROUP_NAME = 'ceiling';

interface ShapeSpec {
  geometry(): THREE.BufferGeometry;
  artMaterials(art: CubeFaceArt, baseColor: string): THREE.Material | THREE.Material[];
  positionOf: PlacementPosition;
  verticalScaleOf?: PlacementVerticalScale;
}

interface FaceArtGroup {
  art: CubeFaceArt;
  baseColor: string;
  placements: TilePlacement[];
}

export function buildChunkMeshGroup(
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  chunkX: number,
  chunkY: number,
): THREE.Group {
  const minX = chunkOrigin(chunkX);
  const minY = chunkOrigin(chunkY);
  const { floors, blocks, trees } = tilePlacementsForRect(
    sampler,
    tileset,
    minX,
    minY,
    CHUNK_SIZE,
    CHUNK_SIZE,
  );
  const markers = markerPlacementsForRect(sampler, minX, minY, CHUNK_SIZE, CHUNK_SIZE);
  const voxels = voxelPlacementsForRect(sampler, tileset, minX, minY, CHUNK_SIZE, CHUNK_SIZE);
  const group = new THREE.Group();
  group.add(
    ...meshesForShape(floors, floorShape()),
    ...meshesForShape(blocks, blockShape()),
    ...meshesForShape(voxels, voxelShape()),
    ...meshesForShape(trees, treeShape()),
    ...meshesForShape(markers, markerShape()),
    ceilingGroup(sampler, tileset, minX, minY),
  );
  return group;
}

function ceilingGroup(
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  minX: number,
  minY: number,
): THREE.Group {
  const placements = ceilingPlacementsForRect(sampler, tileset, minX, minY, CHUNK_SIZE, CHUNK_SIZE);
  const group = new THREE.Group();
  group.name = CEILING_GROUP_NAME;
  group.add(...meshesForShape(placements, ceilingShape()));
  return group;
}

function ceilingShape(): ShapeSpec {
  return {
    geometry: () => new THREE.BoxGeometry(1, BLOCK_LAYER_HEIGHT, 1),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [p.x + 0.5, p.elevation + BLOCK_LAYER_HEIGHT / 2, p.y + 0.5],
  };
}

function voxelShape(): ShapeSpec {
  return {
    geometry: () => new THREE.BoxGeometry(1, BLOCK_LAYER_HEIGHT, 1),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [p.x + 0.5, p.elevation + BLOCK_LAYER_HEIGHT / 2, p.y + 0.5],
  };
}

function floorShape(): ShapeSpec {
  return {
    geometry: () => new THREE.BoxGeometry(1, FLOOR_THICKNESS, 1),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [
      p.x + 0.5,
      p.elevation + (p.sunkenAsWater ? -WATER_DROP : 0) - FLOOR_THICKNESS / 2,
      p.y + 0.5,
    ],
  };
}

function blockShape(): ShapeSpec {
  return {
    geometry: () => new THREE.BoxGeometry(0.95, BLOCK_LAYER_HEIGHT, 0.95),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [p.x + 0.5, p.elevation + BLOCK_LAYER_HEIGHT / 2, p.y + 0.5],
  };
}

function treeShape(): ShapeSpec {
  return {
    geometry: () => new THREE.ConeGeometry(0.42, 1, 7),
    artMaterials: sideFaceMaterial,
    positionOf: (p) => [p.x + 0.5, p.elevation + p.height / 2, p.y + 0.5],
    verticalScaleOf: (p) => p.height,
  };
}

function markerShape(): ShapeSpec {
  return {
    geometry: () => new THREE.ConeGeometry(0.24, MARKER_HEIGHT, 5),
    artMaterials: sideFaceMaterial,
    positionOf: (p) => [p.x + 0.5, p.elevation + MARKER_HEIGHT / 2, p.y + 0.5],
  };
}

function meshesForShape(placements: TilePlacement[], shape: ShapeSpec): THREE.InstancedMesh[] {
  const { flat, artGroups } = splitByFaceArt(placements);
  const meshes = [
    instancedTileMesh(
      shape.geometry(),
      new THREE.MeshLambertMaterial(),
      flat,
      shape.positionOf,
      shape.verticalScaleOf,
    ),
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
    shape.verticalScaleOf,
  );
}

function splitByFaceArt(placements: TilePlacement[]): {
  flat: TilePlacement[];
  artGroups: FaceArtGroup[];
} {
  const flat: TilePlacement[] = [];
  const groups = new Map<CubeFaceArt, FaceArtGroup>();
  for (const placement of placements) {
    if (!placement.faceArt && isTransparentInk(placement.baseColor)) continue;
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

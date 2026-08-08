import * as THREE from 'three';
import { CHUNK_SIZE, chunkOrigin } from '../../../procgen/chunk';
import type { WorldSampler } from '../../../procgen/worldSampler';
import { isTransparentInk, opaqueInk } from '../../../library/tiles/inkColor';
import type { CubeFaceArt } from '../../../library/tiles/tileFaceArt';
import type { ReadOnlyTileset } from '../../../frontend/readOnlyLibraries';
import { cubeFaceMaterials } from './faceArtMaterials';
import {
  instancedTileMesh,
  type PlacementPosition,
  type PlacementVerticalScale,
} from './instancedTileMesh';
import { glowSelfLit } from './selfLitGlow';
import { tileBoxGeometry } from './tileBoxGeometry';
import { ceilingPlacementsForRect } from './ceilingPlacements';
import { markerPlacementsForRect } from './markerPlacements';
import { NO_EXTRA_MARKERS, type MarkerSource } from '../markerSource';
import { tilePlacementsForRect, type TilePlacement } from './tilePlacements';
import { voxelPlacementsForRect } from './voxelPlacements';

export { disposeMeshChildren } from './disposeMeshResources';

const FLOOR_THICKNESS = 0.1;
const WATER_DROP = 0.22;
const BLOCK_LAYER_HEIGHT = 1;
const MARKER_HEIGHT = 0.7;
const MARKER_WIDTH = 0.48;
export const CEILING_GROUP_NAME = 'ceiling';

interface ShapeSpec {
  geometry(): THREE.BufferGeometry;
  artMaterials(art: CubeFaceArt, baseColor: string): THREE.Material | THREE.Material[];
  positionOf: PlacementPosition;
  verticalScaleOf?: PlacementVerticalScale;
}

interface PlacementGroup {
  art: CubeFaceArt | null;
  baseColor: string;
  glow: number;
  placements: TilePlacement[];
}

export function buildChunkMeshGroup(
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  chunkX: number,
  chunkY: number,
  extraMarkers: MarkerSource = NO_EXTRA_MARKERS,
): THREE.Group {
  const minX = chunkOrigin(chunkX);
  const minY = chunkOrigin(chunkY);
  const { floors, blocks } = tilePlacementsForRect(
    sampler,
    tileset,
    minX,
    minY,
    CHUNK_SIZE,
    CHUNK_SIZE,
  );
  const markers = markerPlacementsForRect(sampler, minX, minY, CHUNK_SIZE, CHUNK_SIZE, extraMarkers);
  const voxels = voxelPlacementsForRect(sampler, tileset, minX, minY, CHUNK_SIZE, CHUNK_SIZE);
  const group = new THREE.Group();
  group.add(
    ...meshesForShape(floors, floorShape()),
    ...meshesForShape(blocks, blockShape()),
    ...meshesForShape(voxels, voxelShape()),
    ...meshesForShape(markers.pins, markerShape()),
    ...meshesForShape(markers.standingFixtures, standingFixtureShape()),
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
    geometry: () => tileBoxGeometry(1, BLOCK_LAYER_HEIGHT, 1),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [p.x + 0.5, p.elevation + BLOCK_LAYER_HEIGHT / 2, p.y + 0.5],
  };
}

function voxelShape(): ShapeSpec {
  return {
    geometry: () => tileBoxGeometry(1, BLOCK_LAYER_HEIGHT, 1),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [p.x + 0.5, p.elevation + BLOCK_LAYER_HEIGHT / 2, p.y + 0.5],
  };
}

function floorShape(): ShapeSpec {
  return {
    geometry: () => tileBoxGeometry(1, FLOOR_THICKNESS, 1),
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
    geometry: () => tileBoxGeometry(0.95, BLOCK_LAYER_HEIGHT, 0.95),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [p.x + 0.5, p.elevation + BLOCK_LAYER_HEIGHT / 2, p.y + 0.5],
  };
}

function markerShape(): ShapeSpec {
  return {
    geometry: () => tileBoxGeometry(MARKER_WIDTH, MARKER_HEIGHT, MARKER_WIDTH),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [p.x + 0.5, p.elevation + MARKER_HEIGHT / 2, p.y + 0.5],
  };
}

function standingFixtureShape(): ShapeSpec {
  return {
    geometry: () => tileBoxGeometry(1, 1, 1),
    artMaterials: cubeFaceMaterials,
    positionOf: (p) => [p.x + 0.5, p.elevation + p.height / 2, p.y + 0.5],
    verticalScaleOf: (p) => p.height,
  };
}

function meshesForShape(placements: TilePlacement[], shape: ShapeSpec): THREE.InstancedMesh[] {
  return groupsOfLikeSurface(placements)
    .map((group) => groupMesh(group, shape))
    .filter((mesh): mesh is THREE.InstancedMesh => mesh !== null);
}

function groupMesh(group: PlacementGroup, shape: ShapeSpec): THREE.InstancedMesh | null {
  const materials = group.art
    ? shape.artMaterials(group.art, group.baseColor)
    : new THREE.MeshLambertMaterial();
  glowSelfLit(materials, group.glow, opaqueInk(group.baseColor));
  return instancedTileMesh(
    shape.geometry(),
    materials,
    group.placements,
    shape.positionOf,
    shape.verticalScaleOf,
  );
}

function groupsOfLikeSurface(placements: TilePlacement[]): PlacementGroup[] {
  const groups = new Map<CubeFaceArt | string, PlacementGroup>();
  for (const placement of placements) {
    if (!placement.faceArt && isTransparentInk(placement.baseColor)) continue;
    addToGroup(groups, placement);
  }
  return [...groups.values()];
}

function addToGroup(
  groups: Map<CubeFaceArt | string, PlacementGroup>,
  placement: TilePlacement,
): void {
  const key = placement.faceArt ?? flatSurfaceKey(placement);
  const group = groups.get(key) ?? {
    art: placement.faceArt,
    baseColor: placement.baseColor,
    glow: placement.glow,
    placements: [],
  };
  groups.set(key, group);
  group.placements.push(placement);
}

function flatSurfaceKey(placement: TilePlacement): string {
  return placement.glow > 0 ? `glowing:${placement.baseColor}:${placement.glow}` : 'unlit';
}

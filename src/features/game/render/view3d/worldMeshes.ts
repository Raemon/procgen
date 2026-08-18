import * as THREE from 'three';
import { chunkOrigin, CHUNK_SIZE } from '@/features/asset-library/worlds/chunk';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { isTransparentInk, opaqueInk } from '@/features/asset-library/tiles/inkColor';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { instancedTileMesh } from './instancedTileMesh';
import { MAX_FACE_ART_SIZE } from '@/features/asset-library/tiles/tileFaceArt';
import {
  rememberTileMaterialDetail,
  tileMaterialsAtDetail,
  type TileMaterialDetail,
} from './chunkDetail';
import { glowSelfLit } from './selfLitGlow';
import { markerPlacementsForRect } from './markerPlacements';
import { NO_EXTRA_MARKERS, type MarkerSource } from '../markerSource';
import type { TilePlacement } from './tilePlacements';
import {
  insideChunk,
  placementsAroundChunk,
  type ChunkSurroundings,
} from './culling/chunkSurroundings';
import type { ChunkOccluderField } from './culling/chunkOccluderField';
import {
  occluderFieldOfPlacements,
  type ShapedPlacements,
} from './culling/occluderFieldOfPlacements';
import { EVERY_FACE, visibleFacesOf } from './culling/visibleFaceMask';
import { foldRareFaceVariants, type FacedPlacement } from './culling/foldRareFaceVariants';
import { groupsOfLikeSurfaceAndFaces, type PlacementGroup } from './placementGroups';
import {
  billboardShape,
  blockShape,
  ceilingShape,
  floorShape,
  markerShape,
  shapedShape,
  standingFixtureShape,
  voxelShape,
  type TileShape,
} from './tileShapes';
import { groupedByShapeAndFacing } from './shapedPlacementGroups';

export const CEILING_GROUP_NAME = 'ceiling';

interface MeshBuildDetail {
  sideBudget: number;
}

export function buildChunkMeshGroup(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  chunkX: number,
  chunkY: number,
  extraMarkers: MarkerSource = NO_EXTRA_MARKERS,
  sideBudget: number = MAX_FACE_ART_SIZE,
): THREE.Group {
  const minX = chunkOrigin(chunkX);
  const minY = chunkOrigin(chunkY);
  const around = placementsAroundChunk(sampler, tileAssets, minX, minY);
  const markers = markerPlacementsForRect(sampler, minX, minY, CHUNK_SIZE, CHUNK_SIZE, extraMarkers);
  const detail = { sideBudget };
  const group = new THREE.Group();
  group.add(
    ...terrainMeshes(around, minX, minY, detail),
    ...meshesForShape(markers.pins, markerShape(), detail),
    ...meshesForShape(markers.billboards, billboardShape(), detail),
    ...meshesForShape(markers.standingFixtures, standingFixtureShape(), detail),
    ceilingGroup(around, minX, minY, detail),
  );
  return group;
}

function terrainMeshes(
  around: ChunkSurroundings,
  minX: number,
  minY: number,
  detail: MeshBuildDetail,
): THREE.InstancedMesh[] {
  const field = occluderFieldOfPlacements(around.window, terrainOccluders(around));
  return [
    ...meshesForShape(insideChunk(around.floors, minX, minY), floorShape(), detail, field),
    ...meshesForShape(insideChunk(around.blocks, minX, minY), blockShape(), detail, field),
    ...meshesForShape(insideChunk(around.voxels, minX, minY), voxelShape(), detail, field),
    ...shapedMeshes(insideChunk(around.shaped, minX, minY), detail),
  ];
}

function shapedMeshes(
  placements: readonly TilePlacement[],
  detail: MeshBuildDetail,
): THREE.InstancedMesh[] {
  return groupedByShapeAndFacing(placements).flatMap((solid) =>
    meshesForShape(solid.placements, shapedShape(solid.shape, solid.facing), detail),
  );
}

function terrainOccluders(around: ChunkSurroundings): ShapedPlacements[] {
  return [
    { placements: around.floors, shape: floorShape() },
    { placements: around.blocks, shape: blockShape() },
    { placements: around.voxels, shape: voxelShape() },
  ];
}

function ceilingGroup(
  around: ChunkSurroundings,
  minX: number,
  minY: number,
  detail: MeshBuildDetail,
): THREE.Group {
  const field = occluderFieldOfPlacements(around.window, [
    { placements: around.ceilings, shape: ceilingShape() },
  ]);
  const group = new THREE.Group();
  group.name = CEILING_GROUP_NAME;
  const meshes = meshesForShape(
    insideChunk(around.ceilings, minX, minY),
    ceilingShape(),
    detail,
    field,
  );
  if (meshes.length > 0) group.add(...meshes);
  return group;
}

function meshesForShape(
  placements: readonly TilePlacement[],
  shape: TileShape,
  detail: MeshBuildDetail,
  field?: ChunkOccluderField,
): THREE.InstancedMesh[] {
  return groupsOfLikeSurfaceAndFaces(foldRareFaceVariants(facedPlacements(placements, shape, field)))
    .map((group) => groupMesh(group, shape, detail))
    .filter((mesh): mesh is THREE.InstancedMesh => mesh !== null);
}

function facedPlacements(
  placements: readonly TilePlacement[],
  shape: TileShape,
  field: ChunkOccluderField | undefined,
): FacedPlacement[] {
  const faced: FacedPlacement[] = [];
  for (const placement of placements) {
    if (!showsAnySurface(placement)) continue;
    const faces = visibleFacesOfPlacement(placement, shape, field);
    if (faces !== 0) faced.push({ placement, faces });
  }
  return faced;
}

function showsAnySurface(placement: TilePlacement): boolean {
  return placement.faceArt !== null || placement.textureId !== null || !isTransparentInk(placement.baseColor);
}

function visibleFacesOfPlacement(
  placement: TilePlacement,
  shape: TileShape,
  field: ChunkOccluderField | undefined,
): number {
  if (!field || !shape.occluderBoxOf) return EVERY_FACE;
  return visibleFacesOf(field, placement.x, placement.y, shape.occluderBoxOf(placement));
}

function groupMesh(
  group: PlacementGroup,
  shape: TileShape,
  buildDetail: MeshBuildDetail,
): THREE.InstancedMesh | null {
  if (group.placements.length === 0) return null;
  const detail = materialDetailOf(group);
  const mesh = instancedTileMesh(
    shape.geometry(group.faces),
    detail ? tileMaterialsAtDetail(detail, buildDetail.sideBudget) : untexturedMaterial(group),
    group.placements,
    shape.positionOf,
    shape.scaleOf,
  );
  if (mesh && detail) rememberTileMaterialDetail(mesh, detail);
  return mesh;
}

function materialDetailOf(group: PlacementGroup): TileMaterialDetail | null {
  if (group.art) {
    return {
      kind: 'faceArt',
      surface: { art: group.art, baseColor: group.baseColor, glow: group.glow },
    };
  }
  if (group.textureId !== null) {
    return {
      kind: 'png',
      textureId: group.textureId,
      baseColor: group.baseColor,
      glow: group.glow,
    };
  }
  return null;
}

function untexturedMaterial(group: PlacementGroup): THREE.Material {
  const material = new THREE.MeshLambertMaterial();
  glowSelfLit(material, group.glow, opaqueInk(group.baseColor));
  return material;
}

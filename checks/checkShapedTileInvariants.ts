import * as THREE from 'three';
import { blankFacings, blankVoxels, VOXEL_FACING_COUNT, type Piece } from '../assets/pieces/pieceDef';
import { TILE_SHAPE_KINDS, type TileShapeKind } from '../assets/tiles/tileShapeKind';
import { CELLS_PER_CHUNK, CHUNK_SIZE } from '../procgen/chunk';
import type { PipelineEvaluator } from '../procgen/eval/evaluator';
import { ChunkVoxelColumns } from '../procgen/structureOverlay/chunkVoxelColumns';
import { facingOfVoxel, packedVoxel, tileIdOfVoxel } from '../procgen/structureOverlay/packedVoxel';
import { StructureOverlay, type PieceSource } from '../procgen/structureOverlay/structureOverlay';
import { buildSampledChunk } from '../procgen/sampling/buildSampledChunk';
import type { SampledChunk } from '../procgen/sampling/sampledChunkCache';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import { EVERY_FACE } from '../world/render/view3d/culling/visibleFaceMask';
import { shapedShape } from '../world/render/view3d/tileShapes';
import type { CheckReporter } from './checkReporter';

const EVERY_FACING = [...Array(VOXEL_FACING_COUNT).keys()];
const SYNTHETIC_TILE_ID = 9;
const SYNTHETIC_PIECE_ID = 1;
const STAMPED_AT = { x: 4, y: 6 };

export function checkShapedTileInvariants(check: CheckReporter): void {
  checkPackedVoxelsCarryBothTileAndFacing(check);
  checkEveryShapeAndFacingBuildsGeometry(check);
  checkOnlyCubesOccludeTheirNeighbours(check);
  checkStampedPiecesSurviveTheSampler(check);
}

function checkPackedVoxelsCarryBothTileAndFacing(check: CheckReporter): void {
  const packings = tileIdsWorthPacking().flatMap((tileId) =>
    EVERY_FACING.map((facing) => ({ tileId, facing, packed: packedVoxel(tileId, facing) })),
  );
  check(
    'a packed voxel reads back as the tile and facing it was packed from',
    packings.every(
      (one) => tileIdOfVoxel(one.packed) === one.tileId && facingOfVoxel(one.packed) === one.facing,
    ),
  );
  check(
    'no two tile-and-facing pairs pack to the same number',
    new Set(packings.map((one) => one.packed)).size === packings.length,
  );
  check(
    'a packed voxel never collides with the empty voxel a blank column is filled with',
    packings.every((one) => one.packed >= 0),
  );
}

function tileIdsWorthPacking(): number[] {
  return [0, 1, 2, 3, 7, 64, 255, 4096];
}

function checkEveryShapeAndFacingBuildsGeometry(check: CheckReporter): void {
  const built = everyShapeAndFacing().map((one) => geometryOf(one.shape, one.facing));
  check(
    'every tile shape turned to every facing builds geometry with triangles in it',
    built.every((geometry) => geometry !== null && geometry.getAttribute('position').count > 0),
  );
  check(
    'every built shape keeps a material group per face it draws, so face art still lands',
    built.every((geometry) => geometry !== null && geometry.groups.length > 0),
  );
  check(
    'a shape and facing is built once and handed to every chunk that needs it',
    everyShapeAndFacing().every(
      (one) => geometryOf(one.shape, one.facing) === geometryOf(one.shape, one.facing),
    ),
  );
  check(
    'turning a directional shape actually moves it, rather than drawing the same solid four times',
    boundingBoxesOfEveryFacing('panel').length === EVERY_FACING.length &&
      new Set(boundingBoxesOfEveryFacing('panel')).size === EVERY_FACING.length,
  );
}

function checkOnlyCubesOccludeTheirNeighbours(check: CheckReporter): void {
  check(
    'a shape that leaves part of its cell open seals nothing, so nothing is culled behind it',
    everyShapeAndFacing()
      .filter((one) => one.shape !== 'cube')
      .every((one) => shapedShape(one.shape, one.facing).occluderBoxOf === undefined),
  );
  check(
    'a cube still seals its cell whichever way it is turned',
    EVERY_FACING.every((facing) => shapedShape('cube', facing).occluderBoxOf !== undefined),
  );
}

function checkStampedPiecesSurviveTheSampler(check: CheckReporter): void {
  const sampled = sampledChunkWithStampedPiece();
  check(
    'a stamped ground voxel reaches the sampler as the tile it was painted with',
    sampled.tiles[cellIndexOf(STAMPED_AT.x, STAMPED_AT.y)] === SYNTHETIC_TILE_ID,
  );
  check(
    'terrain the piece never touched keeps no facing of its own',
    [...sampled.groundFacing].every((facing) => facing === 0),
  );
  check(
    'a cell outside the stamped piece is still empty terrain',
    sampled.tiles[cellIndexOf(STAMPED_AT.x + 3, STAMPED_AT.y + 3)] === EMPTY_TILE,
  );
  checkPaintedFacingReachesTheSampler(check);
}

function checkPaintedFacingReachesTheSampler(check: CheckReporter): void {
  const facing = 2;
  const columns = new ChunkVoxelColumns();
  columns.paint(cellIndexOf(1, 1), 0, packedVoxel(SYNTHETIC_TILE_ID, facing));
  const sampled = sampledChunkOf(columns);
  check(
    'a ground voxel painted with a facing keeps both its tile and its facing through sampling',
    sampled.tiles[cellIndexOf(1, 1)] === SYNTHETIC_TILE_ID &&
      sampled.groundFacing[cellIndexOf(1, 1)] === facing,
  );
  check(
    'the ground facing array covers every cell of the chunk',
    sampled.groundFacing.length === CELLS_PER_CHUNK,
  );
}

function sampledChunkWithStampedPiece(): SampledChunk {
  const overlay = new StructureOverlay(syntheticPieceSource(), (chunkX, chunkY) =>
    chunkX === 0 && chunkY === 0
      ? [{ x: STAMPED_AT.x, y: STAMPED_AT.y, pieceId: SYNTHETIC_PIECE_ID, rotation: 0 }]
      : [],
  );
  return sampledChunkOf(overlay.columnsForChunk(0, 0));
}

function sampledChunkOf(columns: ChunkVoxelColumns): SampledChunk {
  return buildSampledChunk(
    evaluatorNothingAsks(),
    { tileLayers: [], ceilings: [], elevation: undefined },
    columns,
    0,
    0,
  );
}

function syntheticPieceSource(): PieceSource {
  const piece = singleVoxelPiece();
  return {
    byId: (id) => (id === SYNTHETIC_PIECE_ID ? piece : undefined),
    largestFootprint: () => 1,
  };
}

function singleVoxelPiece(): Piece {
  return {
    id: SYNTHETIC_PIECE_ID,
    name: 'one voxel',
    role: 'freestanding',
    width: 1,
    depth: 1,
    layers: 1,
    anchorX: 0,
    anchorY: 0,
    voxels: blankVoxels(1, 1, 1).fill(SYNTHETIC_TILE_ID),
    facings: blankFacings(1, 1, 1),
  };
}

function evaluatorNothingAsks(): PipelineEvaluator {
  return {
    valueFor: () => {
      throw new Error('a chunk with no displayed nodes must not evaluate anything');
    },
  } as unknown as PipelineEvaluator;
}

function everyShapeAndFacing(): { shape: TileShapeKind; facing: number }[] {
  return TILE_SHAPE_KINDS.flatMap((shape) => EVERY_FACING.map((facing) => ({ shape, facing })));
}

function geometryOf(shape: TileShapeKind, facing: number): THREE.BufferGeometry | null {
  try {
    return shapedShape(shape, facing).geometry(EVERY_FACE);
  } catch {
    return null;
  }
}

function boundingBoxesOfEveryFacing(shape: TileShapeKind): string[] {
  return EVERY_FACING.map((facing) => roundedBoundingBox(geometryOf(shape, facing)!));
}

function roundedBoundingBox(geometry: THREE.BufferGeometry): string {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  return [box.min, box.max].map((corner) => corner.toArray().map(rounded).join(',')).join('|');
}

function rounded(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function cellIndexOf(x: number, y: number): number {
  return y * CHUNK_SIZE + x;
}

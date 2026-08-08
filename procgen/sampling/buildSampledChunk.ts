import { CELLS_PER_CHUNK } from '../chunk';
import type { PipelineEvaluator } from '../eval/evaluator';
import type { NodeInstance } from '../pipeline/pipelineState';
import { facingOfVoxel, tileIdOfVoxel } from '../prefabOverlay/packedVoxel';
import type { ChunkVoxelColumns } from '../prefabOverlay/chunkVoxelColumns';
import { EMPTY_TILE } from '../values/chunkValues';
import { asField, asTiles } from '../values/valueAccess';
import { mergedCeiling } from './mergedCeiling';
import type { SampledChunk } from './sampledChunkCache';

export interface SampledChunkNodes {
  tileLayers: readonly NodeInstance[];
  ceilings: readonly NodeInstance[];
  elevation: NodeInstance | undefined;
}

export function buildSampledChunk(
  evaluator: PipelineEvaluator,
  nodes: SampledChunkNodes,
  columns: ChunkVoxelColumns,
  chunkX: number,
  chunkY: number,
): SampledChunk {
  const ground = mergedGround(evaluator, nodes.tileLayers, columns, chunkX, chunkY);
  return {
    tiles: ground.tiles,
    groundFacing: ground.facing,
    elevation: scaledElevation(evaluator, nodes.elevation, chunkX, chunkY),
    columns,
    ceiling: mergedCeiling(evaluator, nodes.ceilings, chunkX, chunkY),
  };
}

interface MergedGround {
  tiles: Int32Array;
  facing: Uint8Array;
}

function mergedGround(
  evaluator: PipelineEvaluator,
  tileLayerNodes: readonly NodeInstance[],
  columns: ChunkVoxelColumns,
  chunkX: number,
  chunkY: number,
): MergedGround {
  const ground: MergedGround = {
    tiles: new Int32Array(CELLS_PER_CHUNK).fill(EMPTY_TILE),
    facing: new Uint8Array(CELLS_PER_CHUNK),
  };
  for (const node of tileLayerNodes) {
    overlayTileLayer(ground.tiles, evaluator, node, chunkX, chunkY);
  }
  overlayGroundVoxels(ground, columns);
  return ground;
}

function overlayGroundVoxels(ground: MergedGround, columns: ChunkVoxelColumns): void {
  columns.forEachGroundPackedVoxel((cellIndex, packed) => {
    ground.tiles[cellIndex] = tileIdOfVoxel(packed);
    ground.facing[cellIndex] = facingOfVoxel(packed);
  });
}

function overlayTileLayer(
  merged: Int32Array,
  evaluator: PipelineEvaluator,
  node: NodeInstance,
  chunkX: number,
  chunkY: number,
): void {
  const tiles = asTiles(evaluator.valueFor(node.id, chunkX, chunkY));
  if (!tiles) return;
  for (let cellIndex = 0; cellIndex < merged.length; cellIndex++) {
    const tile = tiles[cellIndex]!;
    if (tile !== EMPTY_TILE) merged[cellIndex] = tile;
  }
}

function scaledElevation(
  evaluator: PipelineEvaluator,
  elevationNode: NodeInstance | undefined,
  chunkX: number,
  chunkY: number,
): Float32Array {
  const elevation = new Float32Array(CELLS_PER_CHUNK);
  if (!elevationNode || elevationNode.display.mode !== 'elevation') return elevation;
  const field = asField(evaluator.valueFor(elevationNode.id, chunkX, chunkY));
  if (!field) return elevation;
  const scale = elevationNode.display.heightScale;
  for (let cellIndex = 0; cellIndex < elevation.length; cellIndex++) {
    elevation[cellIndex] = field[cellIndex]! * scale;
  }
  return elevation;
}

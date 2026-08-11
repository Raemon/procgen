import { CELLS_PER_CHUNK } from '../chunk';
import type { PipelineEvaluator } from '../eval/evaluator';
import type { NodeInstance } from '../pipeline/pipelineState';
import { EMPTY_TILE } from '../values/chunkValues';
import { asTiles } from '../values/valueAccess';

export interface CeilingChunk {
  tiles: Int32Array;
  height: Float32Array;
}

export function mergedCeiling(
  evaluator: PipelineEvaluator,
  ceilingNodes: readonly NodeInstance[],
  chunkX: number,
  chunkY: number,
): CeilingChunk {
  const ceiling: CeilingChunk = {
    tiles: new Int32Array(CELLS_PER_CHUNK).fill(EMPTY_TILE),
    height: new Float32Array(CELLS_PER_CHUNK),
  };
  for (const node of ceilingNodes) overlayCeilingLayer(ceiling, evaluator, node, chunkX, chunkY);
  return ceiling;
}

function overlayCeilingLayer(
  ceiling: CeilingChunk,
  evaluator: PipelineEvaluator,
  node: NodeInstance,
  chunkX: number,
  chunkY: number,
): void {
  if (node.display.mode !== 'ceiling') return;
  const tiles = asTiles(evaluator.valueFor(node.id, chunkX, chunkY));
  if (!tiles) return;
  for (let cellIndex = 0; cellIndex < ceiling.tiles.length; cellIndex++) {
    const tile = tiles[cellIndex]!;
    if (tile === EMPTY_TILE) continue;
    ceiling.tiles[cellIndex] = tile;
    ceiling.height[cellIndex] = node.display.height;
  }
}

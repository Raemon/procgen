import { CHUNK_SIZE } from '../procgen/chunk';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import { asField, asTiles } from '../procgen/values/valueAccess';
import { WorldSampler } from '../procgen/worldSampler';
import { TileAssets } from '../assets/tiles/tileAssets';

export const tileAssets = new TileAssets();

export function worldFromState(state: PipelineState): {
  store: PipelineStore;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
} {
  const store = new PipelineStore(state);
  const evaluator = new PipelineEvaluator(store);
  return { store, evaluator, sampler: new WorldSampler(store, evaluator, tileAssets) };
}

export function islandsState(): PipelineState {
  return sanitizePipeline(examplePipelines()[0]!.state);
}

export function stateOfNodes(nodes: Array<Record<string, unknown>>): PipelineState {
  return sanitizePipeline({ seed: 5, nodes });
}

export function fieldBytes(
  evaluator: PipelineEvaluator,
  nodeId: string,
  cx: number,
  cy: number,
): string {
  return JSON.stringify(Array.from(asField(evaluator.valueFor(nodeId, cx, cy)) ?? []));
}

export function tileBytes(
  evaluator: PipelineEvaluator,
  nodeId: string,
  cx: number,
  cy: number,
): string {
  return JSON.stringify(Array.from(asTiles(evaluator.valueFor(nodeId, cx, cy)) ?? []));
}

export function tileIdsInRegion(sampler: WorldSampler, span: number): Set<number> {
  const seen = new Set<number>();
  for (let y = -span; y < span; y++) {
    for (let x = -span; x < span; x++) seen.add(sampler.tileAt(x, y));
  }
  return seen;
}

export function fieldAt(
  evaluator: PipelineEvaluator,
  nodeId: string,
  worldX: number,
  worldY: number,
): number {
  const cx = Math.floor(worldX / CHUNK_SIZE);
  const cy = Math.floor(worldY / CHUNK_SIZE);
  const field = asField(evaluator.valueFor(nodeId, cx, cy));
  return field ? field[(worldY - cy * CHUNK_SIZE) * CHUNK_SIZE + (worldX - cx * CHUNK_SIZE)]! : 0;
}

export function tileAtNode(
  evaluator: PipelineEvaluator,
  nodeId: string,
  worldX: number,
  worldY: number,
): number {
  const cx = Math.floor(worldX / CHUNK_SIZE);
  const cy = Math.floor(worldY / CHUNK_SIZE);
  const tiles = asTiles(evaluator.valueFor(nodeId, cx, cy));
  return tiles
    ? tiles[(worldY - cy * CHUNK_SIZE) * CHUNK_SIZE + (worldX - cx * CHUNK_SIZE)]!
    : EMPTY_TILE;
}

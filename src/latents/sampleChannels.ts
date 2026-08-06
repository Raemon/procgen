import type { PipelineEvaluator } from '../procgen/eval/evaluator';
import { CHUNK_SIZE } from '../procgen/chunk';
import { nodeTypeOf } from '../procgen/nodeRegistry';
import { outputKindOf } from '../procgen/nodeType';
import type { NodeInstance } from '../procgen/pipeline/pipelineState';
import { asField } from '../procgen/values/valueAccess';
import { hashString } from '../random/hashString';
import { mulberry32 } from '../random/mulberry32';
import type { InferenceProgress, SampledChannels } from './latentTypes';

export interface LatentSource {
  seed(): number;
  nodes(): readonly NodeInstance[];
}

export function fieldNodesOf(source: LatentSource): NodeInstance[] {
  return source.nodes().filter((node) => {
    const def = nodeTypeOf(node.type);
    return node.enabled && def !== undefined && outputKindOf(def, node.params) === 'field';
  });
}

export function* sampleChannelSteps(
  source: LatentSource,
  evaluator: PipelineEvaluator,
  chunkSpan: number,
): Generator<InferenceProgress, SampledChannels> {
  const ordered = shuffledDeterministically(fieldNodesOf(source), source.seed());
  const cellsPerSide = chunkSpan * CHUNK_SIZE;
  const channels = ordered.map(() => new Float32Array(cellsPerSide * cellsPerSide));
  yield* fillChannelSteps(evaluator, ordered, channels, chunkSpan);
  return {
    cellsPerSide,
    channels,
    sealedChannelLabels: ordered.map((node) => `"${node.label}" (${node.type})`),
    channelNodeIds: ordered.map((node) => node.id),
  };
}

function* fillChannelSteps(
  evaluator: PipelineEvaluator,
  ordered: NodeInstance[],
  channels: Float32Array[],
  chunkSpan: number,
): Generator<InferenceProgress, void> {
  const half = Math.floor(chunkSpan / 2);
  let done = 0;
  for (let chunkY = -half; chunkY < chunkSpan - half; chunkY++) {
    for (let chunkX = -half; chunkX < chunkSpan - half; chunkX++) {
      fillOneChunk(evaluator, ordered, channels, chunkSpan, half, chunkX, chunkY);
      yield { phase: 'sampling', done: ++done, total: chunkSpan * chunkSpan };
    }
  }
}

function fillOneChunk(
  evaluator: PipelineEvaluator,
  ordered: NodeInstance[],
  channels: Float32Array[],
  chunkSpan: number,
  half: number,
  chunkX: number,
  chunkY: number,
): void {
  const cellsPerSide = chunkSpan * CHUNK_SIZE;
  ordered.forEach((node, channelIndex) => {
    const field = asField(evaluator.valueFor(node.id, chunkX, chunkY));
    if (!field) return;
    copyChunkIntoChannel(field, channels[channelIndex]!, cellsPerSide, (chunkX + half) * CHUNK_SIZE, (chunkY + half) * CHUNK_SIZE);
  });
}

function copyChunkIntoChannel(
  field: Float32Array,
  channel: Float32Array,
  cellsPerSide: number,
  originX: number,
  originY: number,
): void {
  for (let y = 0; y < CHUNK_SIZE; y++) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      channel[(originY + y) * cellsPerSide + originX + x] = field[y * CHUNK_SIZE + x]!;
    }
  }
}

function shuffledDeterministically(nodes: NodeInstance[], seed: number): NodeInstance[] {
  const rng = mulberry32(hashString(`latents:${seed}`));
  const shuffled = [...nodes];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const swap = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = swap;
  }
  return shuffled;
}

import '../src/procgen/nodes';
import { PipelineEvaluator } from '../src/procgen/eval/evaluator';
import { PipelineStore } from '../src/procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../src/procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../src/procgen/presets/examplePipelines';
import { nodeTypeOf } from '../src/procgen/nodeRegistry';
import { outputKindOf } from '../src/procgen/nodeType';
import { CHUNK_SIZE } from '../src/procgen/chunk';
import { asField } from '../src/procgen/values/valueAccess';
import { mulberry32 } from '../src/random/mulberry32';

const CHUNKS = 8;
const CELLS = CHUNKS * CHUNK_SIZE;
const K = 7;

const preset = examplePipelines().find((pipeline) => pipeline.name === 'earthlike coasts & ranges')!;
const store = new PipelineStore(sanitizePipeline(preset.state));
const evaluator = new PipelineEvaluator(store);

const fieldNodes = store.nodes().filter((node) => {
  const def = nodeTypeOf(node.type);
  return node.enabled && def && outputKindOf(def, node.params) === 'field';
});

const channels: Float32Array[] = fieldNodes.map(() => new Float32Array(CELLS * CELLS));
for (let chunkY = 0; chunkY < CHUNKS; chunkY++) {
  for (let chunkX = 0; chunkX < CHUNKS; chunkX++) {
    fieldNodes.forEach((node, f) => {
      const data = asField(evaluator.valueFor(node.id, chunkX, chunkY))!;
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          channels[f]![(chunkY * CHUNK_SIZE + y) * CELLS + chunkX * CHUNK_SIZE + x] =
            data[y * CHUNK_SIZE + x]!;
        }
      }
    });
  }
}

const normalized = channels.map((channel) => {
  const mean = channel.reduce((sum, value) => sum + value, 0) / channel.length;
  const sd = Math.sqrt(channel.reduce((sum, value) => sum + (value - mean) ** 2, 0) / channel.length) || 1;
  return Float32Array.from(channel, (value) => (value - mean) / sd);
});

const rng = mulberry32(20260806);
const order = normalized.map((_, i) => i);
for (let i = order.length - 1; i > 0; i--) {
  const j = Math.floor(rng() * (i + 1));
  const swap = order[i]!;
  order[i] = order[j]!;
  order[j] = swap;
}
const blind = order.map((i) => normalized[i]!);
const F = blind.length;
const N = CELLS * CELLS;

const dist2 = (cell: number, centroid: Float32Array): number => {
  let d = 0;
  for (let f = 0; f < F; f++) {
    const t = blind[f]![cell]! - centroid[f]!;
    d += t * t;
  }
  return d;
};

const centroids: Float32Array[] = [];
centroids.push(Float32Array.from({ length: F }, (_, f) => blind[f]![Math.floor(rng() * N)]!));
while (centroids.length < K) {
  let bestCell = 0;
  let bestD = -1;
  for (let s = 0; s < 4000; s++) {
    const cell = Math.floor(rng() * N);
    const d = Math.min(...centroids.map((centroid) => dist2(cell, centroid)));
    if (d > bestD) {
      bestD = d;
      bestCell = cell;
    }
  }
  centroids.push(Float32Array.from({ length: F }, (_, f) => blind[f]![bestCell]!));
}

const assign = new Int32Array(N);
for (let iteration = 0; iteration < 25; iteration++) {
  for (let cell = 0; cell < N; cell++) {
    let best = 0;
    let bestD = Infinity;
    for (let k = 0; k < K; k++) {
      const d = dist2(cell, centroids[k]!);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    assign[cell] = best;
  }
  const sums = centroids.map(() => new Float64Array(F));
  const memberCounts = new Float64Array(K);
  for (let cell = 0; cell < N; cell++) {
    const k = assign[cell]!;
    memberCounts[k]!++;
    for (let f = 0; f < F; f++) sums[k]![f] = sums[k]![f]! + blind[f]![cell]!;
  }
  for (let k = 0; k < K; k++) {
    if (memberCounts[k]! > 0) {
      for (let f = 0; f < F; f++) centroids[k]![f] = sums[k]![f]! / memberCounts[k]!;
    }
  }
}

const counts = new Float64Array(K);
for (let cell = 0; cell < N; cell++) counts[assign[cell]!]!++;
const byShare = [...Array(K).keys()].sort((a, b) => counts[b]! - counts[a]!);
const letterOf = new Map(byShare.map((k, i) => [k, 'ABCDEFG'[i]!]));

console.log(`${F} anonymized channels (c0..c${F - 1}), ${N} cells, k=${K}\n`);
console.log('cluster  share   ' + [...Array(F).keys()].map((f) => `c${f}`.padStart(6)).join(''));
for (const k of byShare) {
  const row = [...centroids[k]!].map((value) => value.toFixed(1).padStart(6)).join('');
  console.log(`   ${letterOf.get(k)}    ${((100 * counts[k]!) / N).toFixed(0).padStart(3)}%   ${row}`);
}

console.log('\nspatial map (4x4-cell majority downsample):');
for (let mapY = 0; mapY < 64; mapY++) {
  let line = '';
  for (let mapX = 0; mapX < 64; mapX++) {
    const tally = new Float64Array(K);
    for (let dy = 0; dy < 4; dy++) {
      for (let dx = 0; dx < 4; dx++) {
        tally[assign[(mapY * 4 + dy) * CELLS + mapX * 4 + dx]!]!++;
      }
    }
    line += letterOf.get(tally.indexOf(Math.max(...tally)))!;
  }
  console.log(line);
}

console.log('\n================ UNBLINDING KEY (read only after interpreting) ================');
order.forEach((original, f) => {
  const node = fieldNodes[original]!;
  console.log(`c${f} = "${node.label}" (${node.type})`);
});

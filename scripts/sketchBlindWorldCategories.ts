import '../src/procgen/nodes';
import { PipelineEvaluator } from '../src/procgen/eval/evaluator';
import { PipelineStore } from '../src/procgen/pipeline/pipelineStore';
import { earthlikeCoastsAndRanges } from '../src/procgen/presets/earthlikeCoastsAndRanges';
import { nodeTypeOf } from '../src/procgen/nodeRegistry';
import { outputKindOf } from '../src/procgen/nodeType';
import { CHUNK_SIZE } from '../src/procgen/chunk';
import { asField } from '../src/procgen/values/valueAccess';
import { mulberry32 } from '../src/random/mulberry32';

const CHUNKS = 8;
const CELLS = CHUNKS * CHUNK_SIZE;
const K = 7;

const preset = earthlikeCoastsAndRanges();
const store = new PipelineStore(preset.state);
const evaluator = new PipelineEvaluator(store);

const fieldNodes = store.nodes().filter((n) => {
  const def = nodeTypeOf(n.type);
  return n.enabled && def && outputKindOf(def, n.params) === 'field';
});

const channels: Float32Array[] = fieldNodes.map(() => new Float32Array(CELLS * CELLS));
for (let cy = 0; cy < CHUNKS; cy++) {
  for (let cx = 0; cx < CHUNKS; cx++) {
    fieldNodes.forEach((n, f) => {
      const data = asField(evaluator.valueFor(n.id, cx, cy))!;
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          channels[f][(cy * CHUNK_SIZE + y) * CELLS + cx * CHUNK_SIZE + x] = data[y * CHUNK_SIZE + x];
        }
      }
    });
  }
}

const normalized = channels.map((ch) => {
  const mean = ch.reduce((s, v) => s + v, 0) / ch.length;
  const sd = Math.sqrt(ch.reduce((s, v) => s + (v - mean) ** 2, 0) / ch.length) || 1;
  return Float32Array.from(ch, (v) => (v - mean) / sd);
});

const rng = mulberry32(20260806);
const order = normalized.map((_, i) => i);
for (let i = order.length - 1; i > 0; i--) {
  const j = Math.floor(rng() * (i + 1));
  [order[i], order[j]] = [order[j], order[i]];
}
const blind = order.map((i) => normalized[i]);
const F = blind.length;

const N = CELLS * CELLS;
const dist2 = (cell: number, centroid: Float32Array) => {
  let d = 0;
  for (let f = 0; f < F; f++) { const t = blind[f][cell] - centroid[f]; d += t * t; }
  return d;
};

const centroids: Float32Array[] = [];
centroids.push(Float32Array.from({ length: F }, (_, f) => blind[f][Math.floor(rng() * N)]));
while (centroids.length < K) {
  let bestCell = 0; let bestD = -1;
  for (let s = 0; s < 4000; s++) {
    const cell = Math.floor(rng() * N);
    const d = Math.min(...centroids.map((c) => dist2(cell, c)));
    if (d > bestD) { bestD = d; bestCell = cell; }
  }
  centroids.push(Float32Array.from({ length: F }, (_, f) => blind[f][bestCell]));
}

const assign = new Int32Array(N);
for (let iter = 0; iter < 25; iter++) {
  for (let cell = 0; cell < N; cell++) {
    let best = 0; let bestD = Infinity;
    for (let k = 0; k < K; k++) { const d = dist2(cell, centroids[k]); if (d < bestD) { bestD = d; best = k; } }
    assign[cell] = best;
  }
  const sums = centroids.map(() => new Float64Array(F));
  const counts = new Float64Array(K);
  for (let cell = 0; cell < N; cell++) {
    counts[assign[cell]]++;
    for (let f = 0; f < F; f++) sums[assign[cell]][f] += blind[f][cell];
  }
  for (let k = 0; k < K; k++) if (counts[k] > 0) for (let f = 0; f < F; f++) centroids[k][f] = sums[k][f] / counts[k];
}

const counts = new Float64Array(K);
for (let cell = 0; cell < N; cell++) counts[assign[cell]]++;
const byShare = [...Array(K).keys()].sort((a, b) => counts[b] - counts[a]);
const letterOf = new Map(byShare.map((k, i) => [k, 'ABCDEFG'[i]]));

console.log(`${F} anonymized channels (c0..c${F - 1}), ${N} cells, k=${K}\n`);
console.log('cluster  share   ' + [...Array(F).keys()].map((f) => `c${f}`.padStart(6)).join(''));
for (const k of byShare) {
  const row = [...centroids[k]].map((v) => v.toFixed(1).padStart(6)).join('');
  console.log(`   ${letterOf.get(k)}    ${(100 * counts[k] / N).toFixed(0).padStart(3)}%   ${row}`);
}

console.log('\nspatial map (4x4-cell majority downsample):');
for (let my = 0; my < 64; my++) {
  let line = '';
  for (let mx = 0; mx < 64; mx++) {
    const tally = new Float64Array(K);
    for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) tally[assign[(my * 4 + dy) * CELLS + mx * 4 + dx]]++;
    line += letterOf.get(tally.indexOf(Math.max(...tally)))!;
  }
  console.log(line);
}

console.log('\n================ UNBLINDING KEY (read only after interpreting) ================');
order.forEach((orig, f) => console.log(`c${f} = "${fieldNodes[orig].label}" (${fieldNodes[orig].type})`));

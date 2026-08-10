import '../procgen/nodes';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { seedPersistedFile } from '../frontend/persistence/repoFileStore';
import { CHUNK_SIZE, chunkOrigin } from '../procgen/chunk';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { allNodeTypes } from '../procgen/nodeRegistry';
import type { ChunkGenCtx } from '../procgen/nodeType';
import type { NodeInstance, PipelineState } from '../procgen/pipeline/pipelineState';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { volcanicIslands } from '../procgen/presets/volcanicIslands';
import { asField, asTiles } from '../procgen/values/valueAccess';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import { WorldSampler } from '../procgen/worldSampler';
import { asciiSnapshot } from '../world/render/ascii/asciiSnapshot';
import { markerPlacementsForRect } from '../world/render/view3d/markerPlacements';
import { tilePlacementsForRect } from '../world/render/view3d/tilePlacements';
import { voxelPlacementsForRect } from '../world/render/view3d/voxelPlacements';
import { TileAssets } from '../assets/tiles/tileAssets';

interface NodeCost {
  nodeId: string;
  type: string;
  calls: number;
  regens: number;
  selfMs: number;
  inclusiveMs: number;
}

interface GenStats {
  perNode: Map<string, NodeCost>;
  seenChunks: Set<string>;
  valueForCalls: number;
  stack: { nodeId: string; start: number; childMs: number }[];
}

const stats: GenStats = {
  perNode: new Map(),
  seenChunks: new Set(),
  valueForCalls: 0,
  stack: [],
};

function resetStats(): void {
  stats.perNode.clear();
  stats.seenChunks.clear();
  stats.valueForCalls = 0;
  stats.stack.length = 0;
}

function instrumentNodeGeneration(): void {
  for (const def of allNodeTypes()) {
    const original = def.generateChunk;
    def.generateChunk = (ctx: ChunkGenCtx) => timedGenerate(def.type, original, ctx);
  }
}

function timedGenerate<Value>(
  type: string,
  original: (ctx: ChunkGenCtx) => Value,
  ctx: ChunkGenCtx,
): Value {
  const cost = costRowFor(ctx.nodeId, type);
  cost.calls++;
  const chunkTag = `${ctx.nodeId}|${ctx.chunkX},${ctx.chunkY}`;
  if (stats.seenChunks.has(chunkTag)) cost.regens++;
  stats.seenChunks.add(chunkTag);
  stats.stack.push({ nodeId: ctx.nodeId, start: performance.now(), childMs: 0 });
  try {
    return original(ctx);
  } finally {
    finishTiming(cost);
  }
}

function finishTiming(cost: NodeCost): void {
  const frame = stats.stack.pop()!;
  const inclusive = performance.now() - frame.start;
  cost.inclusiveMs += inclusive;
  cost.selfMs += inclusive - frame.childMs;
  const parent = stats.stack[stats.stack.length - 1];
  if (parent) parent.childMs += inclusive;
}

function costRowFor(nodeId: string, type: string): NodeCost {
  const existing = stats.perNode.get(nodeId);
  if (existing) return existing;
  const row: NodeCost = { nodeId, type, calls: 0, regens: 0, selfMs: 0, inclusiveMs: 0 };
  stats.perNode.set(nodeId, row);
  return row;
}

function countValueForCalls(evaluator: PipelineEvaluator): void {
  const original = evaluator.valueFor.bind(evaluator);
  (evaluator as unknown as { valueFor: typeof original }).valueFor = (nodeId, chunkX, chunkY) => {
    stats.valueForCalls++;
    return original(nodeId, chunkX, chunkY);
  };
}

interface Bench {
  store: PipelineStore;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
  state: PipelineState;
}

function freshWorld(tileAssets: TileAssets): Bench {
  const state = sanitizePipeline(volcanicIslands().state);
  const store = new PipelineStore(state);
  const evaluator = new PipelineEvaluator(store);
  countValueForCalls(evaluator);
  const sampler = new WorldSampler(store, evaluator, tileAssets);
  return { store, evaluator, sampler, state };
}

function buildRegionLikeMeshStreamer(
  bench: Bench,
  tileAssets: TileAssets,
  centerX: number,
  centerY: number,
  radiusChunks: number,
): void {
  const centerChunkX = Math.floor(centerX / CHUNK_SIZE);
  const centerChunkY = Math.floor(centerY / CHUNK_SIZE);
  for (let chunkY = centerChunkY - radiusChunks; chunkY <= centerChunkY + radiusChunks; chunkY++) {
    for (let chunkX = centerChunkX - radiusChunks; chunkX <= centerChunkX + radiusChunks; chunkX++) {
      buildOneChunk(bench, tileAssets, chunkX, chunkY);
    }
  }
}

function buildOneChunk(bench: Bench, tileAssets: TileAssets, chunkX: number, chunkY: number): void {
  const minX = chunkOrigin(chunkX);
  const minY = chunkOrigin(chunkY);
  tilePlacementsForRect(bench.sampler, tileAssets, minX, minY, CHUNK_SIZE, CHUNK_SIZE);
  markerPlacementsForRect(bench.sampler, minX, minY, CHUNK_SIZE, CHUNK_SIZE);
  voxelPlacementsForRect(bench.sampler, tileAssets, minX, minY, CHUNK_SIZE, CHUNK_SIZE);
}

interface ScenarioResult {
  label: string;
  wallMs: number;
  valueForCalls: number;
  generateCalls: number;
  regens: number;
}

function runScenario(label: string, run: () => void): ScenarioResult {
  resetStats();
  const start = performance.now();
  run();
  const wallMs = performance.now() - start;
  let generateCalls = 0;
  let regens = 0;
  for (const row of stats.perNode.values()) {
    generateCalls += row.calls;
    regens += row.regens;
  }
  return { label, wallMs, valueForCalls: stats.valueForCalls, generateCalls, regens };
}

function labelOf(state: PipelineState, nodeId: string): string {
  const node = state.nodes.find((candidate: NodeInstance) => candidate.id === nodeId);
  return node ? node.label : nodeId;
}

function printScenario(result: ScenarioResult): void {
  console.log(
    `${result.label.padEnd(52)} ${result.wallMs.toFixed(0).padStart(7)}ms  ` +
      `valueFor ${String(result.valueForCalls).padStart(9)}  ` +
      `generate ${String(result.generateCalls).padStart(6)}  ` +
      `regen ${String(result.regens).padStart(5)}`,
  );
}

function printTopNodes(state: PipelineState, count: number): void {
  const rows = [...stats.perNode.values()].sort((a, b) => b.selfMs - a.selfMs).slice(0, count);
  console.log('    node                                self ms   incl ms   calls  regens');
  for (const row of rows) {
    const name = `${labelOf(state, row.nodeId)} (${row.type})`;
    console.log(
      `    ${name.padEnd(36)}${row.selfMs.toFixed(0).padStart(8)}${row.inclusiveMs
        .toFixed(0)
        .padStart(10)}${String(row.calls).padStart(8)}${String(row.regens).padStart(8)}`,
    );
  }
}

function directMergedTilesForChunk(bench: Bench, chunkX: number, chunkY: number): Int32Array {
  const merged = new Int32Array(CHUNK_SIZE * CHUNK_SIZE).fill(EMPTY_TILE);
  const layers = bench.store
    .nodes()
    .filter((node) => node.enabled && node.display.mode === 'tileLayer');
  for (const node of layers) {
    const tiles = asTiles(bench.evaluator.valueFor(node.id, chunkX, chunkY));
    if (!tiles) continue;
    for (let index = 0; index < merged.length; index++) {
      const tile = tiles[index]!;
      if (tile !== EMPTY_TILE) merged[index] = tile;
    }
  }
  return merged;
}

function directElevationForChunk(bench: Bench, chunkX: number, chunkY: number): Float32Array {
  const merged = new Float32Array(CHUNK_SIZE * CHUNK_SIZE);
  const bound = bench.store
    .nodes()
    .filter((node) => node.enabled && node.display.mode === 'elevation');
  const node = bound[bound.length - 1];
  if (!node || node.display.mode !== 'elevation') return merged;
  const field = asField(bench.evaluator.valueFor(node.id, chunkX, chunkY));
  if (!field) return merged;
  for (let index = 0; index < merged.length; index++) {
    merged[index] = field[index]! * node.display.heightScale;
  }
  return merged;
}

function perCellVersusPerChunkMicrobench(bench: Bench, repeats: number): void {
  const chunkX = 0;
  const chunkY = 0;
  buildOneChunk(bench, tileAssets, chunkX, chunkY);
  const perCell = timeIt(repeats, () => {
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        bench.sampler.tileAt(chunkOrigin(chunkX) + x, chunkOrigin(chunkY) + y);
        bench.sampler.elevationAt(chunkOrigin(chunkX) + x, chunkOrigin(chunkY) + y);
      }
    }
  });
  const perChunk = timeIt(repeats, () => {
    directMergedTilesForChunk(bench, chunkX, chunkY);
    directElevationForChunk(bench, chunkX, chunkY);
  });
  console.log(
    `\nwarm per-chunk sampling microbench (${repeats} repeats, 1024 cells, tiles+elevation):`,
  );
  console.log(`    per-cell sampler calls   ${perCell.toFixed(2).padStart(9)}ms per chunk`);
  console.log(`    per-chunk direct merge   ${perChunk.toFixed(2).padStart(9)}ms per chunk`);
  console.log(`    overhead factor          ${(perCell / perChunk).toFixed(1).padStart(9)}x`);
}

function timeIt(repeats: number, run: () => void): number {
  const start = performance.now();
  for (let i = 0; i < repeats; i++) run();
  return (performance.now() - start) / repeats;
}

function coldRegionScenarios(tileAssets: TileAssets, centerX: number, centerY: number): void {
  for (const radius of [2, 4, 6]) {
    const bench = freshWorld(tileAssets);
    const side = radius * 2 + 1;
    const result = runScenario(
      `cold build ${side}x${side} chunks at (${centerX},${centerY})`,
      () => buildRegionLikeMeshStreamer(bench, tileAssets, centerX, centerY, radius),
    );
    printScenario(result);
    if (radius === 6) printTopNodes(bench.state, 12);
  }
}

function warmScenarios(tileAssets: TileAssets): void {
  const bench = freshWorld(tileAssets);
  buildRegionLikeMeshStreamer(bench, tileAssets, 0, 0, 6);
  printScenario(
    runScenario('warm rebuild 13x13 chunks (redraw, cache hot)', () =>
      buildRegionLikeMeshStreamer(bench, tileAssets, 0, 0, 6),
    ),
  );
  printScenario(
    runScenario('warm ascii snapshot 120x60 x100 frames', () => {
      for (let i = 0; i < 100; i++) asciiSnapshot(bench.sampler, tileAssets, 0, 0, 120, 60);
    }),
  );
  printScenario(
    runScenario('warm creature spawn scan 81x81 x100', () => {
      for (let i = 0; i < 100; i++) bench.sampler.creatureSpawnsIn(-40, -40, 40, 40);
    }),
  );
  perCellVersusPerChunkMicrobench(bench, 50);
}

function knobTweakScenario(tileAssets: TileAssets): void {
  const bench = freshWorld(tileAssets);
  buildRegionLikeMeshStreamer(bench, tileAssets, 0, 0, 6);
  bench.store.setParam('n5', 'gain', 0.52);
  const result = runScenario('rebuild 13x13 after tweaking one terrain knob (n5)', () =>
    buildRegionLikeMeshStreamer(bench, tileAssets, 0, 0, 6),
  );
  printScenario(result);
  printTopNodes(bench.state, 12);
}

const tileAssets = tilesetFromRepoData();
instrumentNodeGeneration();

console.log('== ember marches: cold generation at the frontier (0,0), zoom sweep ==');
coldRegionScenarios(tileAssets, 0, 0);
console.log('\n== ember marches: cold generation in the green west (-1200,0) ==');
coldRegionScenarios(tileAssets, -1200, 0);
console.log('\n== warm paths ==');
warmScenarios(tileAssets);
console.log('\n== knob tweak invalidation ==');
knobTweakScenario(tileAssets);

function tilesetFromRepoData(): TileAssets {
  seedPersistedFile('tiles', JSON.parse(readFileSync('data/tiles.json', 'utf8')));
  return new TileAssets();
}

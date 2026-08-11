import '@/features/asset-library/worlds/nodes';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stepsTaken } from './explore/explorationTrace';
import {
  measureWorld,
  measurementSummaryLine,
  type WorldMeasurementResult,
} from './explore/metrics/measureWorld';
import { thumbnailHtml } from './explore/report/asciiThumbnail';
import { galleryPageHtml, type GalleryWorld } from './explore/report/galleryHtml';
import { seedPersistedFile } from '@/features/app-shell/persistence/repoFileStore';
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { randomWorldPipeline } from '@/features/asset-library/worlds/randomize/randomWorldPipeline';
import { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { mulberry32 } from '@/features/asset-library/worlds/random/mulberry32';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';

const ROLL_COUNT = Number(process.argv[2] ?? 16);
const ROLL_SEED = Number(process.argv[3] ?? 20260806);
const STEP_BUDGET = Number(process.argv[4] ?? 4000);
const WALK_LIMITS = { stepBudget: STEP_BUDGET, radiusCap: 160 };
const GALLERY_DIR = join(process.cwd(), 'dist', 'worldGallery');

interface Candidate {
  index: number;
  title: string;
  state: PipelineState;
}

interface RankedWorld {
  candidate: Candidate;
  result: WorldMeasurementResult;
  sampler: WorldSampler;
}

const tileAssets = tilesetFromRepoData();
const candidates = [currentPipelineCandidate(), ...rolledCandidates(tileAssets)];
const { ranked, unmeasurable } = measureCandidates(candidates, tileAssets);
writeGallery(ranked);
printRanking(ranked, unmeasurable);

function tilesetFromRepoData(): TileAssets {
  seedPersistedFile('tiles', JSON.parse(readFileSync('data/tiles.json', 'utf8')));
  return new TileAssets();
}

function currentPipelineCandidate(): Candidate {
  const state = sanitizePipeline(JSON.parse(readFileSync('data/pipeline.json', 'utf8')));
  return { index: 0, title: 'current data/pipeline.json', state };
}

function rolledCandidates(activeTiles: TileAssets): Candidate[] {
  const rng = mulberry32(ROLL_SEED);
  const tileIds = activeTiles.all().map((tile) => tile.id);
  return Array.from({ length: ROLL_COUNT }, (_, i) => ({
    index: i + 1,
    title: `roll ${i + 1}`,
    state: sanitizePipeline(randomWorldPipeline(rng, tileIds)),
  }));
}

function measureCandidates(
  all: Candidate[],
  activeTiles: TileAssets,
): { ranked: RankedWorld[]; unmeasurable: Candidate[] } {
  const ranked: RankedWorld[] = [];
  const unmeasurable: Candidate[] = [];
  for (const candidate of all) {
    const world = measuredCandidate(candidate, activeTiles);
    if (world) ranked.push(world);
    else unmeasurable.push(candidate);
  }
  ranked.sort((a, b) => b.result.score.overall - a.result.score.overall);
  return { ranked, unmeasurable };
}

function measuredCandidate(candidate: Candidate, activeTiles: TileAssets): RankedWorld | null {
  const store = new PipelineStore(candidate.state);
  const sampler = new WorldSampler(store, new PipelineEvaluator(store), activeTiles);
  const result = measureWorld(sampler, activeTiles, WALK_LIMITS);
  if (!result) return null;
  console.log(`measured ${candidate.title}: ${measurementSummaryLine(result)}`);
  return { candidate, result, sampler };
}

function writeGallery(ranked: RankedWorld[]): void {
  mkdirSync(GALLERY_DIR, { recursive: true });
  const worlds = ranked.map(galleryWorldOf);
  for (const world of worlds) {
    writeFileSync(join(GALLERY_DIR, world.pipelineFileName), world.pipelineJson);
  }
  writeFileSync(join(GALLERY_DIR, 'index.html'), galleryPageHtml(worlds, generatedLabel()));
  writeFileSync(join(GALLERY_DIR, 'results.json'), resultsJson(worlds));
}

function galleryWorldOf(world: RankedWorld, position: number): GalleryWorld {
  return {
    rank: position + 1,
    title: world.candidate.title,
    seed: world.candidate.state.seed,
    nodeSummary: nodeSummaryOf(world.candidate.state),
    steps: stepsTaken(world.result.trace),
    exhaustedRegion: world.result.trace.exhaustedRegion,
    score: world.result.score,
    measurements: world.result.measurements,
    thumbnail: thumbnailHtml(world.sampler, tileAssets, world.result.trace.spawn),
    pipelineFileName: `world-${String(world.candidate.index).padStart(2, '0')}.pipeline.json`,
    pipelineJson: JSON.stringify(world.candidate.state, null, 2) + '\n',
  };
}

function nodeSummaryOf(state: PipelineState): string {
  const labels = state.nodes.map((node) => `${node.label} (${node.type})`);
  return labels.length > 0 ? labels.join(', ') : 'empty pipeline';
}

function generatedLabel(): string {
  return `${ROLL_COUNT} rolls from rng seed ${ROLL_SEED}, plus the current pipeline · ${STEP_BUDGET}-step explorer budget · generated ${new Date().toISOString()}`;
}

function resultsJson(worlds: GalleryWorld[]): string {
  const rows = worlds.map(({ thumbnail: _thumbnail, pipelineJson: _json, ...row }) => row);
  return JSON.stringify(rows, null, 2) + '\n';
}

function printRanking(ranked: RankedWorld[], unmeasurable: Candidate[]): void {
  console.log('\nrank  score  world');
  ranked.forEach((world, position) => {
    const score = world.result.score.overall.toFixed(3);
    console.log(`${String(position + 1).padStart(4)}  ${score}  ${world.candidate.title}`);
  });
  for (const candidate of unmeasurable) {
    console.log(`  --  no walkable spawn near origin: ${candidate.title}`);
  }
  console.log(`\ngallery: ${join(GALLERY_DIR, 'index.html')}`);
}

import '../procgen/nodes';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stepsTaken } from './explore/explorationTrace';
import { driverFromEnvironment } from './explore/drivers/driverFromEnvironment';
import type { WorldDriver } from './explore/drivers/worldDriver';
import {
  measureWorld,
  measurementSummaryLine,
  type WorldMeasurementResult,
} from './explore/metrics/measureWorld';
import { thumbnailHtml } from './explore/report/asciiThumbnail';
import { galleryPageHtml, type GalleryWorld } from './explore/report/galleryHtml';
import { headlessServerWorld } from '../api/agent/headless/headlessServerWorld';
import type { ServerWorld } from '../api/agent/serverWorld';
import { seedPersistedFile } from '../frontend/persistence/repoFileStore';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { randomWorldPipeline } from '../procgen/randomize/randomWorldPipeline';
import { mulberry32 } from '../procgen/random/mulberry32';
import { TileAssets } from '../assets/tiles/tileAssets';

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
  world: ServerWorld;
}

const tilesJson: unknown = JSON.parse(readFileSync('data/tiles.json', 'utf8'));
const tileAssets = tilesetFromRepoData();
const driver = driverFromEnvironment(process.env, ROLL_SEED);
const candidates = [currentPipelineCandidate(), ...rolledCandidates(tileAssets)];
const { ranked, unmeasurable } = await measureCandidates(candidates, driver);
writeGallery(ranked);
printRanking(ranked, unmeasurable);

function tilesetFromRepoData(): TileAssets {
  seedPersistedFile('tiles', tilesJson);
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

function candidateWorld(candidate: Candidate): ServerWorld {
  return headlessServerWorld((name) => {
    if (name === 'tiles') return tilesJson;
    if (name === 'pipeline') return candidate.state;
    return null;
  });
}

async function measureCandidates(
  all: Candidate[],
  worldDriver: WorldDriver,
): Promise<{ ranked: RankedWorld[]; unmeasurable: Candidate[] }> {
  const ranked: RankedWorld[] = [];
  const unmeasurable: Candidate[] = [];
  for (const candidate of all) {
    const world = await measuredCandidate(candidate, worldDriver);
    if (world) ranked.push(world);
    else unmeasurable.push(candidate);
  }
  ranked.sort((a, b) => b.result.score.overall - a.result.score.overall);
  return { ranked, unmeasurable };
}

async function measuredCandidate(
  candidate: Candidate,
  worldDriver: WorldDriver,
): Promise<RankedWorld | null> {
  const world = candidateWorld(candidate);
  const result = await measureWorld(world, WALK_LIMITS, worldDriver, candidate.state.seed);
  if (!result) return null;
  console.log(`measured ${candidate.title}: ${measurementSummaryLine(result)}`);
  return { candidate, result, world };
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
    thumbnail: thumbnailHtml(world.world.sampler, tileAssets, world.result.trace.spawn),
    pipelineFileName: `world-${String(world.candidate.index).padStart(2, '0')}.pipeline.json`,
    pipelineJson: JSON.stringify(world.candidate.state, null, 2) + '\n',
  };
}

function nodeSummaryOf(state: PipelineState): string {
  const labels = state.nodes.map((node) => `${node.label} (${node.type})`);
  return labels.length > 0 ? labels.join(', ') : 'empty pipeline';
}

function generatedLabel(): string {
  return `${ROLL_COUNT} rolls from rng seed ${ROLL_SEED}, plus the current pipeline · ${STEP_BUDGET}-step ${driver.name} budget · generated ${new Date().toISOString()}`;
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

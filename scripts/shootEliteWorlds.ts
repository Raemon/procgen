import '@/features/asset-library/worlds/nodes';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { worldOfGenome } from '@/features/asset-library/worlds/selfPlay/genomeWorld';
import { funOf, walkSeedOf, type ScoredWorld } from '@/features/asset-library/worlds/selfPlay/scoreGenome';
import { runTraining } from '@/features/asset-library/worlds/selfPlay/trainingLoop';
import { genomeAsJson } from '@/features/asset-library/worlds/selfPlay/worldGenome';
import { measureWalkingSimFun } from '@/features/asset-library/worlds/walkingSim/measureWalkingSimFun';
import { touristLimits } from '@/features/asset-library/worlds/walkingSim/touristWalk';
import { browserViewBundle } from './agentView/browserViewBundle';
import { captureWorldViewPng } from './agentView/captureWorldViewPng';
import type { WorldViewRequest } from './agentView/worldViewRequest';
import { pngBuffer } from './png/writePng';
import { trainingSettingsOf } from './selfPlay/trainingOptions';
import { documentOfGenome } from './worldShots/genomeDocument';
import { galleryHtml, type WorldShotRecord } from './worldShots/galleryReport';
import { imageInterest } from './worldShots/imageInterest';
import { overheadShot } from './worldShots/overheadShot';
import { shotPointsOf, type ShotPoint } from './worldShots/shotPoints';

const OUT_DIR = flagValue('out') ?? 'artifacts/worldShots';
const TOP_WORLDS = Number(flagValue('top') ?? 6);
const SKIP_3D = process.argv.includes('--skip3d');
const OVERHEAD_SIDE = 200;
const OVERHEAD_SCALE = 3;
const SHOT_WIDTH = 640;
const SHOT_HEIGHT = 440;
const WALK_PATIENCE_MS = 15_000;

const settings = trainingSettingsOf(process.argv.slice(2));
const startedAt = Date.now();

console.log(`training ${settings.generations} generations of batch ${settings.batchSize}...`);
const run = runTraining(settings, (record) =>
  console.log(
    `gen ${String(record.generation).padStart(3)}  best ${record.archiveBestFun.toFixed(3)}  coverage ${record.coverage.toFixed(2)}  admitted ${record.admissions}  ${Math.round((Date.now() - startedAt) / 1000)}s`,
  ),
);
const elites = showcaseSlateOf(run.archive.rankedByFun());
console.log(`shooting ${elites.length} elites into ${OUT_DIR}...`);

function showcaseSlateOf(ranked: readonly ScoredWorld[]): ScoredWorld[] {
  const gated = ranked.filter((elite) => elite.measurements.elevationGateShare > 0.02);
  console.log(`archive holds ${ranked.length} elites, ${gated.length} with real elevation gates`);
  const cliffs = gated.slice(0, 2);
  const flats = ranked.filter((elite) => !cliffs.includes(elite)).slice(0, TOP_WORLDS - cliffs.length);
  return [...flats, ...cliffs].sort((one, other) => funOf(other) - funOf(one)).slice(0, TOP_WORLDS);
}
mkdirSync(OUT_DIR, { recursive: true });
const bundle = SKIP_3D ? '' : await browserViewBundle();

const records: WorldShotRecord[] = [];
for (const [index, elite] of elites.entries()) {
  records.push(await shootWorld(elite, index));
}
writeFileSync(join(OUT_DIR, 'report.json'), `${JSON.stringify(records, null, 2)}\n`);
writeFileSync(join(OUT_DIR, 'index.html'), galleryHtml(records, headlineOf()));
console.log(`\n${records.filter((each) => each.verdict === 'interesting').length}/${records.length} worlds look interesting`);
console.log(`gallery: ${join(OUT_DIR, 'index.html')}`);

function headlineOf(): string {
  return `${elites.length} elites from ${settings.generations} generations × ${settings.batchSize}, step budget ${settings.stepBudget}, seed ${settings.seed} — best fun ${run.archive.bestFun().toFixed(3)}, archive coverage ${run.archive.coverage().toFixed(2)}`;
}

async function shootWorld(elite: ScoredWorld, index: number): Promise<WorldShotRecord> {
  const slug = `${String(index + 1).padStart(2, '0')}-${slugOf(elite.paletteName)}`;
  const dir = join(OUT_DIR, slug);
  mkdirSync(dir, { recursive: true });
  const world = worldOfGenome(elite.genome);
  const points = shotPointsFor(elite);
  const spawn = points[0]!;
  const overhead = overheadShot(world, {
    centerX: spawn.x,
    centerY: spawn.y,
    side: OVERHEAD_SIDE,
    scale: OVERHEAD_SCALE,
  });
  writeFileSync(join(dir, 'overhead.png'), pngBuffer(overhead));
  const interest = imageInterest(overhead);
  const shots = ['overhead.png', ...(SKIP_3D ? [] : await threeDShots(elite, dir, points))];
  writeFileSync(join(dir, 'genome.json'), genomeAsJson(elite.genome));
  const record: WorldShotRecord = {
    slug,
    name: elite.paletteName,
    fun: funOf(elite),
    verdict: interest.verdict,
    interest,
    elevationGateShare: elite.measurements.elevationGateShare,
    vistaMomentsPer100Steps: elite.measurements.vistaMomentsPer100Steps,
    decisionPointsPer100Steps: elite.measurements.decisionPointsPer100Steps,
    encountersPer100Steps: elite.measurements.encountersPer100Steps,
    shots,
  };
  writeFileSync(join(dir, 'world.json'), `${JSON.stringify({ ...record, measurements: elite.measurements }, null, 2)}\n`);
  console.log(`  ${slug}: fun ${record.fun.toFixed(3)} ${record.verdict} (${shots.length} shots)`);
  return record;
}

function shotPointsFor(elite: ScoredWorld): ShotPoint[] {
  const world = worldOfGenome(elite.genome);
  const limits = { ...touristLimits(settings.stepBudget, settings.radiusCap), patienceMs: WALK_PATIENCE_MS };
  const walked = measureWalkingSimFun(world.sampler, world.tileAssets, limits, walkSeedOf(elite.genome));
  if (!walked) return [{ label: 'spawn', x: 0, y: 0, facing: 0 }];
  return shotPointsOf(walked.trace, (x, y) => world.sampler.elevationAt(x, y));
}

async function threeDShots(
  elite: ScoredWorld,
  dir: string,
  points: readonly ShotPoint[],
): Promise<string[]> {
  const document = documentOfGenome(elite.genome);
  const shots: string[] = [];
  const wanted: Array<[ShotPoint, 'god' | 'character']> = [
    [points[0]!, 'god'],
    [points[1] ?? points[0]!, 'character'],
    [points[2] ?? points[0]!, 'character'],
  ];
  for (const [point, style] of wanted) {
    const name = `${point.label}-${style}.png`;
    try {
      const rendered = await captureWorldViewPng(requestFor(document, point, style), bundle);
      writeFileSync(join(dir, name), Buffer.from(rendered.pngDataUrl.split(',')[1]!, 'base64'));
      shots.push(name);
    } catch (error) {
      console.error(`  3d shot failed (${name}): ${(error as Error).message}`);
    }
  }
  return shots;
}

function requestFor(
  document: ReturnType<typeof documentOfGenome>,
  point: ShotPoint,
  style: 'god' | 'character',
): WorldViewRequest {
  return {
    worldName: document.name,
    worldDocument: document,
    x: point.x,
    y: point.y,
    facing: point.facing,
    style,
    cameraDistanceTiles: style === 'god' ? 46 : null,
    fieldOfViewDeg: null,
    width: SHOT_WIDTH,
    height: SHOT_HEIGHT,
    showCeilings: false,
    sightRadiusTiles: style === 'character' ? 40 : null,
  };
}

function slugOf(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'world'
  );
}

function flagValue(name: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
}

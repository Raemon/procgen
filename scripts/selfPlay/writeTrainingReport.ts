import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tilesAsStoredJson } from '@/features/asset-library/tiles/tileStorage';
import { cellOf } from '@/features/asset-library/worlds/selfPlay/eliteArchive';
import { worldOfGenome } from '@/features/asset-library/worlds/selfPlay/genomeWorld';
import type { ScoredWorld } from '@/features/asset-library/worlds/selfPlay/scoreGenome';
import type {
  GenerationRecord,
  TrainingSettings,
} from '@/features/asset-library/worlds/selfPlay/trainingLoop';
import { genomeAsJson } from '@/features/asset-library/worlds/selfPlay/worldGenome';
import { spawnWithRoomToWalk } from '@/features/asset-library/worlds/walkingSim/spawnCell';
import {
  cachedTileIdProbe,
  walkableProbeFrom,
} from '@/features/asset-library/worlds/walkingSim/worldProbes';
import { thumbnailHtml } from '../explore/report/asciiThumbnail';
import { trainingReportHtml, type ReportElite } from './trainingReportHtml';

export const TRAINING_REPORT_DIR = join(process.cwd(), 'dist', 'selfPlay');
export const RANKING_REPORT_DIR = join(process.cwd(), 'dist', 'walkingSimRank');

const ELITES_SHOWN = 12;

export function writeTrainingReport(
  reportDir: string,
  elites: readonly ScoredWorld[],
  trajectory: readonly GenerationRecord[],
  headline: string,
  stillRunning: boolean,
): void {
  mkdirSync(reportDir, { recursive: true });
  const shown = elites.slice(0, ELITES_SHOWN).map((world, at) => reportEliteOf(reportDir, world, at));
  writeFileSync(join(reportDir, 'trajectory.json'), `${JSON.stringify(trajectory, null, 2)}\n`);
  writeFileSync(
    join(reportDir, 'index.html'),
    trainingReportHtml({ headline, trajectory, elites: shown, stillRunning }),
  );
}

export function trainingHeadlineOf(
  settings: TrainingSettings,
  trajectory: readonly GenerationRecord[],
): string {
  return headlineOf(settings, trajectory);
}

function headlineOf(
  settings: TrainingSettings,
  trajectory: readonly GenerationRecord[],
): string {
  return [
    `${trajectory.length} of ${settings.generations} generations`,
    `batch ${settings.batchSize}`,
    `${settings.stepBudget}-step walks`,
    `seed ${settings.seed}`,
    `generated ${new Date().toISOString()}`,
  ].join(' · ');
}

function reportEliteOf(reportDir: string, world: ScoredWorld, position: number): ReportElite {
  const fileStem = `elite-${String(position + 1).padStart(2, '0')}`;
  writeGenomeFiles(reportDir, world, fileStem);
  return {
    rank: position + 1,
    fun: world.score.overall,
    paletteName: world.paletteName,
    cell: cellOf(world.measurements),
    nodeSummary: nodeSummaryOf(world),
    readings: world.score.readings,
    thumbnail: thumbnailOf(world),
    genomeFileName: `${fileStem}.genome.json`,
  };
}

function writeGenomeFiles(reportDir: string, world: ScoredWorld, fileStem: string): void {
  const { palette } = worldOfGenome(world.genome);
  writeFileSync(join(reportDir, `${fileStem}.genome.json`), genomeAsJson(world.genome));
  writeFileSync(
    join(reportDir, `${fileStem}.pipeline.json`),
    `${JSON.stringify(world.genome.pipeline, null, 2)}\n`,
  );
  writeFileSync(
    join(reportDir, `${fileStem}.tiles.json`),
    `${JSON.stringify(tilesAsStoredJson(palette.tiles), null, 2)}\n`,
  );
}

function nodeSummaryOf(world: ScoredWorld): string {
  const labels = world.genome.pipeline.nodes.map((node) => node.type);
  return labels.length > 0 ? labels.join(' → ') : 'empty pipeline';
}

function thumbnailOf(world: ScoredWorld): string {
  const { sampler, tileAssets } = worldOfGenome(world.genome);
  const isWalkableAt = walkableProbeFrom(cachedTileIdProbe(sampler), tileAssets);
  const center = spawnWithRoomToWalk(isWalkableAt) ?? { x: 0, y: 0 };
  return thumbnailHtml(sampler, tileAssets, center);
}

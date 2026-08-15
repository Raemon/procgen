import '@/features/asset-library/worlds/nodes';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { genomeFromJson } from '@/features/asset-library/worlds/selfPlay/worldGenome';
import { installGenomeAsPreset } from './worldShots/installWorldPreset';
import type { WorldShotRecord } from './worldShots/galleryReport';

const SHOTS_DIR = flagValue('shots') ?? 'artifacts/worldShots';
const MOST_INSTALLED = Number(flagValue('install') ?? 3);

const records = JSON.parse(readFileSync(join(SHOTS_DIR, 'report.json'), 'utf8')) as WorldShotRecord[];
const interesting = records.filter((record) => record.verdict === 'interesting');
const pool = interesting.length > 0 ? interesting : records;
const seenNames = new Set<string>();
const distinct = pool.filter((record) =>
  seenNames.has(record.name) ? false : (seenNames.add(record.name), true),
);
const gated = distinct.find((record) => record.elevationGateShare > 0.02);
const flats = distinct.filter((record) => record !== gated).slice(0, MOST_INSTALLED - (gated ? 1 : 0));
const chosen = gated ? [...flats, gated] : flats;

const taken = new Set<string>();
for (const record of chosen) {
  const genome = genomeFromJson(
    JSON.parse(readFileSync(join(SHOTS_DIR, record.slug, 'genome.json'), 'utf8')),
  );
  const name = freeName(`${record.name} (evolved)`, taken);
  const installed = installGenomeAsPreset(genome, name, descriptionOf(record));
  console.log(
    `installed ${installed.name}: +${installed.tilesAdded} tiles, +${installed.piecesAdded} pieces`,
  );
}
console.log('run `npm run docs:seed` (or open a fresh database) to load the new presets');

function descriptionOf(record: WorldShotRecord): string {
  return `Evolved walking-sim elite: fun ${record.fun.toFixed(3)}, elevation gates ${record.elevationGateShare.toFixed(2)}, vistas ${record.vistaMomentsPer100Steps.toFixed(1)}/100 steps, decisions ${record.decisionPointsPer100Steps.toFixed(0)}/100 steps.`;
}

function freeName(wanted: string, taken: Set<string>): string {
  let name = wanted;
  let copy = 2;
  while (taken.has(name)) name = `${wanted} ${copy++}`;
  taken.add(name);
  return name;
}

function flagValue(name: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
}

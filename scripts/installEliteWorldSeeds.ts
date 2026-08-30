import '@/features/asset-library/worlds/nodes';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { genomeFromJson } from '@/features/asset-library/worlds/selfPlay/worldSeedGenome';
import { installGenomeAsWorldSeed } from './worldShots/installWorldSeed';
import type { WorldShotRecord } from './worldShots/galleryReport';

const SHOTS_DIR = flagValue('shots') ?? 'artifacts/worldShots';
const MOST_INSTALLED = Number(flagValue('install') ?? 3);

const WANTED_SLUGS = (flagValue('slugs') ?? '').split(',').filter((slug) => slug.length > 0);

const records = JSON.parse(readFileSync(join(SHOTS_DIR, 'report.json'), 'utf8')) as WorldShotRecord[];
const presentable = records.filter(
  (record) => record.verdict === 'interesting' && !record.blindAtEyeLevel,
);
const interesting = records.filter((record) => record.verdict === 'interesting');
const pool = presentable.length > 0 ? presentable : interesting.length > 0 ? interesting : records;
const seenNames = new Set<string>();
const distinct = pool.filter((record) =>
  seenNames.has(record.name) ? false : (seenNames.add(record.name), true),
);
const chosen = WANTED_SLUGS.length > 0 ? namedRecords(records, WANTED_SLUGS) : autoChosen(distinct);

const taken = new Set<string>();
for (const record of chosen) {
  const genome = genomeFromJson(
    JSON.parse(readFileSync(join(SHOTS_DIR, record.slug, 'genome.json'), 'utf8')),
  );
  const name = freeName(`${record.name} (evolved)`, taken);
  const installed = installGenomeAsWorldSeed(genome, name, descriptionOf(record));
  console.log(
    `installed ${installed.name}: +${installed.tilesAdded} tiles, +${installed.piecesAdded} pieces`,
  );
}
console.log('the new world seeds are code now: they load with the app, and a database picks up their assets on its next boot');

function namedRecords(
  records: readonly WorldShotRecord[],
  slugs: readonly string[],
): WorldShotRecord[] {
  return slugs.map((slug) => {
    const found = records.find((record) => record.slug === slug);
    if (!found) throw new Error(`no world in ${SHOTS_DIR}/report.json has slug ${slug}`);
    return found;
  });
}

function autoChosen(distinct: readonly WorldShotRecord[]): WorldShotRecord[] {
  const gated = distinct.find((record) => record.elevationGateShare > 0.02);
  const flats = distinct
    .filter((record) => record !== gated)
    .slice(0, MOST_INSTALLED - (gated ? 1 : 0));
  return gated ? [...flats, gated] : flats;
}

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

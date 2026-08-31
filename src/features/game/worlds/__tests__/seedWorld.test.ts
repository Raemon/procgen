import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { tileAssets } from '@/features/asset-library/worlds/__tests__/pipelineWorldFixtures';
import { noiseTerrainState } from '@/features/asset-library/worlds/__tests__/terrainFixtureState';
import { NO_ITEMS } from '@/features/asset-library/items/itemAssets';
import { NO_CULTURES } from '@/features/asset-library/worlds/assembly/cultureSource';
import { NO_PIECES } from '@/features/asset-library/worlds/assembly/pieceSource';
import { growSeedWorld } from '../seedWorld';

const ASSETS = { tileAssets, pieces: NO_PIECES, items: NO_ITEMS, cultures: NO_CULTURES };

export function checkSeedWorlds(check: CheckReporter): void {
  const pipeline = noiseTerrainState();
  const left = growSeedWorld(pipeline, 11, ASSETS);
  const right = growSeedWorld(pipeline, 99, ASSETS);
  check(
    'two seeds of the same pipeline grow different ground',
    tilesAround(left.sampler) !== tilesAround(right.sampler),
  );
  check(
    'the same seed of the same pipeline grows the same ground twice',
    tilesAround(growSeedWorld(pipeline, 11, ASSETS).sampler) === tilesAround(left.sampler),
  );
  const atPipelineSeed = growSeedWorld(pipeline, pipeline.seed, ASSETS);
  check('a preview grown at the pipeline seed keeps that seed', atPipelineSeed.store.seed() === pipeline.seed);
  left.syncPipeline({ ...pipeline, daylight: 0 });
  check('syncing a preview keeps the seed that cell was grown from', left.store.seed() === 11);
  check('syncing a preview takes the new daylight', left.store.daylight() === 0);
}

function tilesAround(sampler: { tileAt(x: number, y: number): number }): string {
  const tiles: number[] = [];
  for (let y = -8; y < 8; y++) {
    for (let x = -8; x < 8; x++) tiles.push(sampler.tileAt(x, y));
  }
  return tiles.join(',');
}

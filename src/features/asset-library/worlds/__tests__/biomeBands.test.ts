import '../nodes';
import type { PipelineState } from '../pipeline/pipelineState';
import { EMPTY_TILE } from '../values/chunkValues';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { fieldAt, stateOfNodes, tileAtNode, worldFromState } from './pipelineWorldFixtures';

const BIOME_SEA = 0;
const BIOME_SHORE = 1;
const BIOME_GROUND = 2;
const BIOME_ROCK = 4;
const BIOME_DEEP = 5;
const BIOME_SNOW = 7;

function biomeState(): PipelineState {
  return stateOfNodes([
    { id: 'terrain', type: 'terrainNoise', params: { scale: 0.02, style: 0, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'steep', type: 'slopeField', params: { radius: 3, gain: 40 }, inputs: { source: 'terrain' } },
    { id: 'shore', type: 'distanceToThreshold', params: { level: 0.5, range: 32 }, inputs: { elevation: 'terrain' } },
    { id: 'half', type: 'constantField', params: { value: 1 }, inputs: {} },
    {
      id: 'biome',
      type: 'biomeBands',
      params: {
        seaLevel: 0.5, deepDrop: 0.06, shoreBand: 0.06, rockAbove: 0.45, snowLine: 0.8, regionAtLeast: 0.5,
        deepTile: BIOME_DEEP, waterTile: BIOME_SEA, shoreTile: BIOME_SHORE, groundTile: BIOME_GROUND,
        rockTile: BIOME_ROCK, snowTile: BIOME_SNOW,
      },
      inputs: { elevation: 'terrain', steepness: 'steep', shoreDistance: 'shore', region: null },
    },
    {
      id: 'maskedBiome',
      type: 'biomeBands',
      params: {
        seaLevel: 0.5, deepDrop: 0.06, shoreBand: 0.06, rockAbove: 0.45, snowLine: 0.8, regionAtLeast: 0.5,
        deepTile: BIOME_DEEP, waterTile: BIOME_SEA, shoreTile: BIOME_SHORE, groundTile: BIOME_GROUND,
        rockTile: BIOME_ROCK, snowTile: BIOME_SNOW,
      },
      inputs: { elevation: 'terrain', steepness: 'steep', shoreDistance: 'shore', region: 'terrain' },
    },
  ]);
}

function everyCellInRegion(span: number, holds: (x: number, y: number) => boolean): boolean {
  for (let y = -span; y < span; y++) {
    for (let x = -span; x < span; x++) if (!holds(x, y)) return false;
  }
  return true;
}

export function checkBiomeBands(check: CheckReporter): void {
  const biome = worldFromState(biomeState());
  const biomeTiles = new Set<number>();
  for (let y = -48; y < 48; y++) {
    for (let x = -48; x < 48; x++) biomeTiles.add(tileAtNode(biome.evaluator, 'biome', x, y));
  }
  check('one biome node paints sea, shore, ground and rock from a single card', [BIOME_SEA, BIOME_SHORE, BIOME_GROUND, BIOME_ROCK].every((tile) => biomeTiles.has(tile)));
  check('a biome node never leaves a cell empty when it has no region mask', !biomeTiles.has(EMPTY_TILE));
  check(
    'water is deep only further below sea level than the deep cut point',
    everyCellInRegion(48, (x, y) => {
      const height = fieldAt(biome.evaluator, 'terrain', x, y);
      const tile = tileAtNode(biome.evaluator, 'biome', x, y);
      return tile !== BIOME_DEEP || height < 0.5 - 0.06;
    }),
  );
  check(
    'a region mask holds a biome back and leaves those cells to another layer',
    everyCellInRegion(48, (x, y) =>
      fieldAt(biome.evaluator, 'terrain', x, y) >= 0.5 ||
      tileAtNode(biome.evaluator, 'maskedBiome', x, y) === EMPTY_TILE),
  );
}

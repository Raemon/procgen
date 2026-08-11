import '@/features/asset-library/worlds/nodes';
import { defaultTileId } from '@/features/asset-library/tiles/defaultTiles';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { EMPTY_TILE } from '@/features/asset-library/worlds/values/chunkValues';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { fieldAt, stateOfNodes, tileAtNode, tileBytes, worldFromState } from '@/features/asset-library/worlds/__tests__/pipelineWorldFixtures';

const SPAN = 72;
const LAKE_TILE = defaultTileId('lake water');
const SHALLOW_TILE = defaultTileId('shallow water');
const RAPIDS_TILE = defaultTileId('whitewater');
const RIVER_TILE = defaultTileId('river water');

function waterState(overrides: Record<string, Record<string, number>> = {}): PipelineState {
  const params = (id: string, base: Record<string, number>) => ({ ...base, ...(overrides[id] ?? {}) });
  return stateOfNodes([
    { id: 'plates', type: 'tectonicUplift', params: { plateSize: 256, oceanFraction: 0.55, beltWidth: 64, rangeHeight: 0.34, landHeight: 0.6, basinDepth: 0.34 }, inputs: {} },
    { id: 'detail', type: 'terrainNoise', params: { scale: 0.018, style: 0, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'blended', type: 'blendFields', params: { weight: 0.3 }, inputs: { a: 'plates', b: 'detail' } },
    { id: 'terrain', type: 'hypsometricCurve', params: { seaLevel: 0.5, steepness: 9 }, inputs: { source: 'blended' } },
    { id: 'flow', type: 'flowAccumulation', params: params('flow', { seaLevel: 0.5, catchmentScale: 2200, convergence: 4, channelizeAbove: 20, fillPits: 1, windowRadius: 48 }), inputs: { elevation: 'terrain' } },
    { id: 'eroded', type: 'carveValleys', params: { depth: 0.09, minFlow: 0.35, valleyWidth: 7 }, inputs: { elevation: 'terrain', flow: 'flow' } },
    { id: 'flooded', type: 'fillDepressions', params: { seaLevel: 0.5, maxFill: 0.18, windowRadius: 64 }, inputs: { elevation: 'eroded' } },
    { id: 'steepness', type: 'slopeField', params: { radius: 3, gain: 14 }, inputs: { source: 'eroded' } },
    { id: 'rivers', type: 'riverFromFlow', params: { minFlow: 0.5, maxWidth: 5, seaLevel: 0.5, riverTile: RIVER_TILE }, inputs: { flow: 'flow', elevation: 'eroded' } },
    { id: 'lakes', type: 'lakeFromFill', params: params('lakes', { seaLevel: 0.5, minDepth: 0.004, shallowDepth: 0.016, lakeTile: LAKE_TILE, shallowTile: SHALLOW_TILE }), inputs: { ground: 'eroded', flooded: 'flooded' } },
    { id: 'rapids', type: 'rapidsFromFlow', params: params('rapids', { minFlow: 0.5, minSteepness: 0.28, seaLevel: 0.5, rapidsTile: RAPIDS_TILE }), inputs: { flow: 'flow', steepness: 'steepness', elevation: 'eroded' } },
  ]);
}

function cellsPainted(state: PipelineState, nodeId: string, tile: number): Array<[number, number]> {
  const world = worldFromState(state);
  const found: Array<[number, number]> = [];
  for (let y = -SPAN; y < SPAN; y++) {
    for (let x = -SPAN; x < SPAN; x++) {
      const painted = tileAtNode(world.evaluator, nodeId, x, y);
      if (painted !== EMPTY_TILE && (tile === EMPTY_TILE || painted === tile)) found.push([x, y]);
    }
  }
  return found;
}

function countPainted(state: PipelineState, nodeId: string, tile: number): number {
  return cellsPainted(state, nodeId, tile).length;
}

export function checkStandingAndBrokenWater(check: CheckReporter): void {
  const world = worldFromState(waterState());
  const lakeCells = cellsPainted(waterState(), 'lakes', EMPTY_TILE);
  const rapidsCells = cellsPainted(waterState(), 'rapids', RAPIDS_TILE);

  check('the water test world has standing water in it', lakeCells.length > 0);
  check('the water test world has broken water in it', rapidsCells.length > 0);

  check(
    'standing water is only painted where the flooded surface stands above the ground it drowned',
    lakeCells.every(
      ([x, y]) => fieldAt(world.evaluator, 'flooded', x, y) - fieldAt(world.evaluator, 'eroded', x, y) >= 0.004 - 1e-6,
    ),
  );
  check(
    'no lake is painted below sea level, where the ocean already is',
    lakeCells.every(([x, y]) => fieldAt(world.evaluator, 'flooded', x, y) >= 0.5),
  );
  check(
    'the shallow rim is shallower than the water it surrounds',
    lakeCells
      .filter(([x, y]) => tileAtNode(world.evaluator, 'lakes', x, y) === SHALLOW_TILE)
      .every(([x, y]) => fieldAt(world.evaluator, 'flooded', x, y) - fieldAt(world.evaluator, 'eroded', x, y) < 0.016) &&
    lakeCells
      .filter(([x, y]) => tileAtNode(world.evaluator, 'lakes', x, y) === LAKE_TILE)
      .every(([x, y]) => fieldAt(world.evaluator, 'flooded', x, y) - fieldAt(world.evaluator, 'eroded', x, y) >= 0.016),
  );
  check(
    'a lake sits at one level across its whole surface rather than draping over its bed',
    lakeSurfacesAreFlat(world.evaluator, lakeCells),
  );
  check(
    'asking for deeper water leaves fewer lake cells',
    countPainted(waterState({ lakes: { minDepth: 0.05 } }), 'lakes', EMPTY_TILE) < lakeCells.length,
  );

  check(
    'broken water needs both the flow and the grade, not either alone',
    rapidsCells.every(
      ([x, y]) => fieldAt(world.evaluator, 'flow', x, y) >= 0.5 && fieldAt(world.evaluator, 'steepness', x, y) >= 0.28,
    ),
  );
  check(
    'every rapid sits on a cell the river layer also paints, so white water is never on dry ground',
    rapidsCells.every(([x, y]) => tileAtNode(world.evaluator, 'rivers', x, y) !== EMPTY_TILE),
  );
  check(
    'raising the grade a river must break over leaves fewer rapids',
    countPainted(waterState({ rapids: { minSteepness: 0.6 } }), 'rapids', RAPIDS_TILE) < rapidsCells.length,
  );

  check(
    'letting water spread wets ground that a single-path router leaves dry',
    dampCells(waterState({ flow: { convergence: 1, channelizeAbove: 2000 } })) >
      dampCells(waterState({ flow: { channelizeAbove: 1 } })),
  );

  const again = worldFromState(waterState());
  check(
    'lakes and rapids regenerate identically from the same seed',
    tileBytes(world.evaluator, 'lakes', 1, 1) === tileBytes(again.evaluator, 'lakes', 1, 1) &&
      tileBytes(world.evaluator, 'rapids', 1, 1) === tileBytes(again.evaluator, 'rapids', 1, 1),
  );
}

function lakeSurfacesAreFlat(
  evaluator: ReturnType<typeof worldFromState>['evaluator'],
  lakeCells: Array<[number, number]>,
): boolean {
  const painted = new Set(lakeCells.map(([x, y]) => `${x},${y}`));
  const visited = new Set<string>();
  for (const [startX, startY] of lakeCells) {
    if (visited.has(`${startX},${startY}`)) continue;
    const level = fieldAt(evaluator, 'flooded', startX, startY);
    const queue = [[startX, startY] as [number, number]];
    visited.add(`${startX},${startY}`);
    while (queue.length > 0) {
      const [x, y] = queue.pop()!;
      if (Math.abs(fieldAt(evaluator, 'flooded', x, y) - level) > 1e-3) return false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const key = `${x + dx!},${y + dy!}`;
        if (!painted.has(key) || visited.has(key)) continue;
        visited.add(key);
        queue.push([x + dx!, y + dy!]);
      }
    }
  }
  return true;
}

function dampCells(state: PipelineState): number {
  const world = worldFromState(state);
  let damp = 0;
  for (let y = -SPAN; y < SPAN; y++) {
    for (let x = -SPAN; x < SPAN; x++) {
      if (fieldAt(world.evaluator, 'eroded', x, y) < 0.5) continue;
      if (fieldAt(world.evaluator, 'flow', x, y) > 0.2) damp++;
    }
  }
  return damp;
}

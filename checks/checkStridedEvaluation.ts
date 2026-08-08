import '../procgen/nodes';
import { FINE_STRIDE, cellsSpanningTiles, worldCoordOfCell } from '../procgen/cellStride';
import { CHUNK_SIZE } from '../procgen/chunk';
import type { PipelineEvaluator } from '../procgen/eval/evaluator';
import { asField } from '../procgen/values/valueAccess';
import type { CheckReporter } from './checkReporter';
import { stateOfNodes, worldFromState } from './pipelineWorldFixtures';

const COARSE_STRIDE = 8;

export function checkStridedEvaluation(check: CheckReporter): void {
  checkAnalyticNodesResampleExactly(check);
  checkStrideKeepsItsOwnCachedValues(check);
  checkTileKnobsHoldTheirMeaningAcrossStrides(check);
}

function noiseWorld(): { evaluator: PipelineEvaluator } {
  return worldFromState(
    stateOfNodes([
      {
        id: 'noise',
        type: 'terrainNoise',
        params: { scale: 0.01, style: 0, octaves: 4, lacunarity: 2, gain: 0.5 },
        inputs: {},
      },
    ]),
  );
}

function platesWorld(): { evaluator: PipelineEvaluator } {
  return worldFromState(
    stateOfNodes([
      {
        id: 'plates',
        type: 'tectonicUplift',
        params: {
          plateSize: 256,
          oceanFraction: 0.6,
          beltWidth: 64,
          rangeHeight: 0.34,
          landHeight: 0.58,
          basinDepth: 0.34,
        },
        inputs: {},
      },
    ]),
  );
}

function cellAt(
  evaluator: PipelineEvaluator,
  nodeId: string,
  chunkX: number,
  chunkY: number,
  stride: number,
  cellX: number,
  cellY: number,
): number {
  const field = asField(evaluator.valueFor(nodeId, chunkX, chunkY, stride));
  return field ? field[cellY * CHUNK_SIZE + cellX]! : Number.NaN;
}

function fineValueAtWorld(
  evaluator: PipelineEvaluator,
  nodeId: string,
  worldX: number,
  worldY: number,
): number {
  const chunkX = Math.floor(worldX / CHUNK_SIZE);
  const chunkY = Math.floor(worldY / CHUNK_SIZE);
  return cellAt(
    evaluator,
    nodeId,
    chunkX,
    chunkY,
    FINE_STRIDE,
    worldX - chunkX * CHUNK_SIZE,
    worldY - chunkY * CHUNK_SIZE,
  );
}

function coarseMatchesFineEverywhere(nodeId: string, world: { evaluator: PipelineEvaluator }): boolean {
  for (let cellY = 0; cellY < CHUNK_SIZE; cellY += 5) {
    for (let cellX = 0; cellX < CHUNK_SIZE; cellX += 5) {
      const coarse = cellAt(world.evaluator, nodeId, 1, 1, COARSE_STRIDE, cellX, cellY);
      const worldX = worldCoordOfCell(CHUNK_SIZE + cellX, COARSE_STRIDE);
      const worldY = worldCoordOfCell(CHUNK_SIZE + cellY, COARSE_STRIDE);
      if (coarse !== fineValueAtWorld(world.evaluator, nodeId, worldX, worldY)) return false;
    }
  }
  return true;
}

function checkAnalyticNodesResampleExactly(check: CheckReporter): void {
  check(
    'terrain noise sampled coarsely equals the fine field at the world points it lands on',
    coarseMatchesFineEverywhere('noise', noiseWorld()),
  );
  check(
    'tectonic uplift sampled coarsely equals the fine field at the world points it lands on',
    coarseMatchesFineEverywhere('plates', platesWorld()),
  );
}

function checkStrideKeepsItsOwnCachedValues(check: CheckReporter): void {
  const world = noiseWorld();
  const coarseFirst = cellAt(world.evaluator, 'noise', 0, 0, COARSE_STRIDE, 3, 3);
  const fine = cellAt(world.evaluator, 'noise', 0, 0, FINE_STRIDE, 3, 3);
  check(
    'a coarse chunk and the fine chunk of the same name do not read back each other from the cache',
    coarseFirst !== fine,
  );
  check(
    'asking for the coarse chunk again after the fine one still gives the coarse answer',
    cellAt(world.evaluator, 'noise', 0, 0, COARSE_STRIDE, 3, 3) === coarseFirst,
  );
}

function checkTileKnobsHoldTheirMeaningAcrossStrides(check: CheckReporter): void {
  check(
    'a radius in tiles becomes at least one cell however coarse the stride gets',
    cellsSpanningTiles(3, 256) >= 1,
  );
  check(
    'a radius in tiles is unchanged when every cell is one tile',
    cellsSpanningTiles(7, FINE_STRIDE) === 7,
  );
  check(
    'a radius in tiles shrinks in proportion to the stride',
    cellsSpanningTiles(64, 8) === 8,
  );
}

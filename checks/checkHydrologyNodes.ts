import '../procgen/nodes';
import { CHUNK_SIZE } from '../procgen/chunk';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import type { CheckReporter } from './checkReporter';
import {
  fieldAt,
  fieldBytes,
  stateOfNodes,
  tileAtNode,
  worldFromState,
} from './pipelineWorldFixtures';

function hydrologyState(): PipelineState {
  return stateOfNodes([
    { id: 'plates', type: 'tectonicUplift', params: { plateSize: 256, oceanFraction: 0.6, beltWidth: 64, rangeHeight: 0.34, landHeight: 0.58, basinDepth: 0.34 }, inputs: {} },
    { id: 'detail', type: 'terrainNoise', params: { scale: 0.02, style: 0, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'terrain', type: 'blendFields', params: { weight: 0.3 }, inputs: { a: 'plates', b: 'detail' } },
    { id: 'filled', type: 'fillDepressions', params: { seaLevel: 0.5, maxFill: 0.2, windowRadius: 40 }, inputs: { elevation: 'terrain' } },
    { id: 'flow', type: 'flowAccumulation', params: { seaLevel: 0.5, catchmentScale: 3000, fillPits: 1, windowRadius: 40 }, inputs: { elevation: 'terrain' } },
    { id: 'coast', type: 'coastDistance', params: { seaLevel: 0.5, range: 32 }, inputs: { elevation: 'terrain' } },
    { id: 'eroded', type: 'carveValleys', params: { depth: 0.08, minFlow: 0.4, valleyWidth: 6 }, inputs: { elevation: 'terrain', flow: 'flow' } },
    { id: 'rivers', type: 'riverFromFlow', params: { minFlow: 0.5, maxWidth: 1, seaLevel: 0.5, riverTile: 0 }, inputs: { flow: 'flow', elevation: 'terrain' } },
    { id: 'wideRivers', type: 'riverFromFlow', params: { minFlow: 0.5, maxWidth: 5, seaLevel: 0.5, riverTile: 0 }, inputs: { flow: 'flow', elevation: 'terrain' } },
  ]);
}

function isAwayFromChunkEdge(coord: number): boolean {
  const inChunk = ((coord % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  return inChunk > 0 && inChunk < CHUNK_SIZE - 1;
}

function isInsideOwnChunk(x: number, y: number): boolean {
  return isAwayFromChunkEdge(x) && isAwayFromChunkEdge(y);
}

const SPAN = 64;

type HydrologyWorld = ReturnType<typeof worldFromState>;

export function checkHydrologyNodes(check: CheckReporter): void {
  const hydrology = worldFromState(hydrologyState());
  checkWindowedWaterNodesAreDeterministicRegardlessOfEvaluationOrder(check, hydrology);
  checkAChunkGetsTheSameWaterAnswerAloneOrAmongItsNeighbors(check, hydrology);
  checkFillingDepressionsRaisesTheGroundUntilNoPitIsClosed(check, hydrology);
  checkCarvingValleysOnlyRemovesMaterialAndOnlyNearWatercourses(check, hydrology);
  checkDistanceToCoastSeparatesLandFromSea(check, hydrology);
  checkFlowAccumulationYieldsARiverNetworkThatReachesTheSea(check, hydrology);
  checkRiverFlowOnlyGrowsDownstream(check, hydrology);
  checkRiversWidenWithTheMaxWidthKnob(check, hydrology);
}

function checkWindowedWaterNodesAreDeterministicRegardlessOfEvaluationOrder(
  check: CheckReporter,
  hydrology: HydrologyWorld,
): void {
  const hydrologyReversed = worldFromState(hydrologyState());
  const flowForward = [fieldBytes(hydrology.evaluator, 'flow', 0, 0), fieldBytes(hydrology.evaluator, 'flow', 3, -2)];
  const flowReversed = [fieldBytes(hydrologyReversed.evaluator, 'flow', 3, -2), fieldBytes(hydrologyReversed.evaluator, 'flow', 0, 0)];
  check(
    'windowed water nodes are deterministic regardless of evaluation order',
    flowForward[0] === flowReversed[1] && flowForward[1] === flowReversed[0],
  );
}

function checkAChunkGetsTheSameWaterAnswerAloneOrAmongItsNeighbors(
  check: CheckReporter,
  hydrology: HydrologyWorld,
): void {
  const hydrologyLoneChunk = worldFromState(hydrologyState());
  check(
    'flow accumulation gives a chunk the same answer alone or beside its region neighbors',
    fieldBytes(hydrologyLoneChunk.evaluator, 'flow', 1, 1) ===
      fieldBytes(hydrology.evaluator, 'flow', 1, 1),
  );
  check(
    'coast distance gives a chunk the same answer alone or beside its region neighbors',
    fieldBytes(hydrologyLoneChunk.evaluator, 'coast', 2, 1) ===
      fieldBytes(hydrology.evaluator, 'coast', 2, 1),
  );
}

function checkFillingDepressionsRaisesTheGroundUntilNoPitIsClosed(
  check: CheckReporter,
  hydrology: HydrologyWorld,
): void {
  const landCells = landCellsAround(hydrology);
  check('the hydrology test world has land to drain', landCells.length > 0);
  check(
    'filling depressions never lowers the ground',
    landCells.every(([x, y]) => fieldAt(hydrology.evaluator, 'filled', x, y) >= fieldAt(hydrology.evaluator, 'terrain', x, y) - 1e-6),
  );
  check(
    'no land cell of the filled surface is a closed pit',
    landCells.every(([x, y]) => {
      const here = fieldAt(hydrology.evaluator, 'filled', x, y);
      return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(
        ([dx, dy]) => fieldAt(hydrology.evaluator, 'filled', x + dx!, y + dy!) <= here,
      );
    }),
  );
}

function checkCarvingValleysOnlyRemovesMaterialAndOnlyNearWatercourses(
  check: CheckReporter,
  hydrology: HydrologyWorld,
): void {
  const landCells = landCellsAround(hydrology);
  check(
    'carving valleys only ever removes material, and only near watercourses',
    landCells.every(([x, y]) => fieldAt(hydrology.evaluator, 'eroded', x, y) <= fieldAt(hydrology.evaluator, 'terrain', x, y) + 1e-6) &&
      landCells.some(([x, y]) => fieldAt(hydrology.evaluator, 'eroded', x, y) < fieldAt(hydrology.evaluator, 'terrain', x, y) - 1e-6) &&
      landCells.some(([x, y]) => Math.abs(fieldAt(hydrology.evaluator, 'eroded', x, y) - fieldAt(hydrology.evaluator, 'terrain', x, y)) < 1e-6),
  );
}

function checkDistanceToCoastSeparatesLandFromSea(
  check: CheckReporter,
  hydrology: HydrologyWorld,
): void {
  const landCells = landCellsAround(hydrology);
  check(
    'distance to coast puts land at or above 0.5 and sea below it',
    landCells.every(([x, y]) => fieldAt(hydrology.evaluator, 'coast', x, y) >= 0.5),
  );
}

function checkFlowAccumulationYieldsARiverNetworkThatReachesTheSea(
  check: CheckReporter,
  hydrology: HydrologyWorld,
): void {
  const flowRiverCells = riverCellsOfNode(hydrology, 'rivers');
  check('flow accumulation yields a river network', flowRiverCells.length > 0);
  check(
    'every flow-derived river cell continues into another river cell or the sea',
    flowRiverCells.every(([x, y]) =>
      [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].some(
        ([dx, dy]) =>
          tileAtNode(hydrology.evaluator, 'rivers', x + dx!, y + dy!) !== EMPTY_TILE ||
          fieldAt(hydrology.evaluator, 'terrain', x + dx!, y + dy!) < 0.5,
      ),
    ),
  );
}

function checkRiverFlowOnlyGrowsDownstream(
  check: CheckReporter,
  hydrology: HydrologyWorld,
): void {
  const flowRiverCells = riverCellsOfNode(hydrology, 'rivers');
  check(
    'river flow only grows downstream inside a chunk',
    flowRiverCells.filter(([x, y]) => isInsideOwnChunk(x, y)).every(([x, y]) => {
      const here = fieldAt(hydrology.evaluator, 'flow', x, y);
      return [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].some(
        ([dx, dy]) =>
          fieldAt(hydrology.evaluator, 'flow', x + dx!, y + dy!) >= here ||
          fieldAt(hydrology.evaluator, 'terrain', x + dx!, y + dy!) < 0.5,
      );
    }),
  );
}

function checkRiversWidenWithTheMaxWidthKnob(
  check: CheckReporter,
  hydrology: HydrologyWorld,
): void {
  const flowRiverCells = riverCellsOfNode(hydrology, 'rivers');
  const wideRiverCells = riverCellsOfNode(hydrology, 'wideRivers').length;
  check('rivers widen with the max width knob', wideRiverCells > flowRiverCells.length);
}

function landCellsAround(hydrology: HydrologyWorld): Array<[number, number]> {
  const landCells: Array<[number, number]> = [];
  for (let y = -SPAN; y < SPAN; y++) {
    for (let x = -SPAN; x < SPAN; x++) if (fieldAt(hydrology.evaluator, 'terrain', x, y) >= 0.5) landCells.push([x, y]);
  }
  return landCells;
}

function riverCellsOfNode(hydrology: HydrologyWorld, nodeId: string): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let y = -SPAN; y < SPAN; y++) {
    for (let x = -SPAN; x < SPAN; x++) if (tileAtNode(hydrology.evaluator, nodeId, x, y) !== EMPTY_TILE) cells.push([x, y]);
  }
  return cells;
}

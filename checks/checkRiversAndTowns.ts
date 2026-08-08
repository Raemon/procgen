import '../procgen/nodes';
import { CHUNK_SIZE } from '../procgen/chunk';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { traceRiverDownhill } from '../procgen/nodes/rivers/traceRiverDownhill';
import { hashLatticePoint } from '../procgen/noise/hashLatticePoint';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import { asField, asTiles } from '../procgen/values/valueAccess';
import type { CheckReporter } from './checkReporter';
import { tileBytes, worldFromState } from './pipelineWorldFixtures';

const rampElevation = (x: number): number => Math.max(0, Math.min(1, 0.9 - 0.005 * (x + 40)));
const rampHash = (x: number, y: number): number => hashLatticePoint(x, y, 7);

function riversExampleState(): PipelineState {
  return sanitizePipeline(examplePipelines()[5]!.state);
}

function riverCellAt(evaluator: PipelineEvaluator, worldX: number, worldY: number): boolean {
  const cx = Math.floor(worldX / CHUNK_SIZE);
  const cy = Math.floor(worldY / CHUNK_SIZE);
  const tiles = asTiles(evaluator.valueFor('n3', cx, cy));
  if (!tiles) return false;
  return tiles[(worldY - cy * CHUNK_SIZE) * CHUNK_SIZE + (worldX - cx * CHUNK_SIZE)] !== EMPTY_TILE;
}

function terrainAt(evaluator: PipelineEvaluator, worldX: number, worldY: number): number {
  const cx = Math.floor(worldX / CHUNK_SIZE);
  const cy = Math.floor(worldY / CHUNK_SIZE);
  const field = asField(evaluator.valueFor('n1', cx, cy));
  return field ? field[(worldY - cy * CHUNK_SIZE) * CHUNK_SIZE + (worldX - cx * CHUNK_SIZE)]! : 0;
}

type RiverWorld = ReturnType<typeof worldFromState>;

export function checkRiversAndTowns(check: CheckReporter): void {
  const riversA = worldFromState(riversExampleState());
  checkARiverRunsDownhillUntilTheSeaStopsIt(check);
  checkRiverChunksAreDeterministicRegardlessOfEvaluationOrder(check, riversA);
  checkEveryRiverCellContinuesIntoAnotherRiverCellOrTheSea(check, riversA);
  checkTownsAppearTaggedAndStandingOnTheRiver(check, riversA);
  checkEveryTownStandsAtARiverMouthOrJunction(check, riversA);
  checkTownsKeepTheirConfiguredSpacingFromEachOther(check, riversA);
}

function checkARiverRunsDownhillUntilTheSeaStopsIt(check: CheckReporter): void {
  const straightRiver = traceRiverDownhill(
    (x) => rampElevation(x),
    rampHash,
    { seaLevel: 0.4, maxLength: 300, meander: 0 },
    0,
    0,
  );
  check(
    'a river on a slope flows straight downhill and stops at the sea',
    straightRiver.length === 61 &&
      straightRiver.every((cell, i) => cell.x === i && cell.y === 0),
  );
  const meanderingRiver = traceRiverDownhill(
    (x) => rampElevation(x),
    rampHash,
    { seaLevel: 0.4, maxLength: 300, meander: 0.05 },
    0,
    0,
  );
  check(
    'meander makes rivers wander but never uphill',
    meanderingRiver.some((cell) => cell.y !== 0) &&
      meanderingRiver.every(
        (cell, i) => i === 0 || rampElevation(cell.x) <= rampElevation(meanderingRiver[i - 1]!.x),
      ),
  );
}

function checkRiverChunksAreDeterministicRegardlessOfEvaluationOrder(
  check: CheckReporter,
  riversA: RiverWorld,
): void {
  const riversB = worldFromState(riversExampleState());
  const riverSeq = [tileBytes(riversA.evaluator, 'n3', 0, 0), tileBytes(riversA.evaluator, 'n3', 2, -2)];
  const riverRev = [tileBytes(riversB.evaluator, 'n3', 2, -2), tileBytes(riversB.evaluator, 'n3', 0, 0)];
  check(
    'river chunks are deterministic regardless of evaluation order',
    riverSeq[0] === riverRev[1] && riverSeq[1] === riverRev[0],
  );
}

function checkEveryRiverCellContinuesIntoAnotherRiverCellOrTheSea(
  check: CheckReporter,
  riversA: RiverWorld,
): void {
  const riverCells = riverCellsAround(riversA.evaluator);
  const flowsSomewhere = (x: number, y: number): boolean =>
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(
      ([dx, dy]) =>
        riverCellAt(riversA.evaluator, x + dx!, y + dy!) ||
        terrainAt(riversA.evaluator, x + dx!, y + dy!) < 0.45,
    );
  check('rivers appear in the rivers & towns preset', riverCells.length > 0);
  check(
    'every river cell continues into another river cell or the sea',
    riverCells.every(([x, y]) => flowsSomewhere(x, y)),
  );
}

function checkTownsAppearTaggedAndStandingOnTheRiver(
  check: CheckReporter,
  riversA: RiverWorld,
): void {
  const towns = riversA.sampler.markersIn(-96, -96, 95, 95);
  check(
    'towns appear and are tagged as towns',
    towns.length > 0 && towns.every((m) => m.tag === 'town' && m.glyph === '⌂'),
  );
  check(
    'every town sits on a river',
    towns.every((m) => riverCellAt(riversA.evaluator, m.x, m.y)),
  );
}

function checkEveryTownStandsAtARiverMouthOrJunction(
  check: CheckReporter,
  riversA: RiverWorld,
): void {
  const towns = riversA.sampler.markersIn(-96, -96, 95, 95);
  check(
    'every town qualifies as a river mouth or river junction',
    towns.every(
      (m) =>
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].filter(([dx, dy]) => riverCellAt(riversA.evaluator, m.x + dx!, m.y + dy!)).length >= 3 ||
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => terrainAt(riversA.evaluator, m.x + dx!, m.y + dy!) < 0.45),
    ),
  );
}

function checkTownsKeepTheirConfiguredSpacingFromEachOther(
  check: CheckReporter,
  riversA: RiverWorld,
): void {
  const towns = riversA.sampler.markersIn(-96, -96, 95, 95);
  check(
    'towns keep their configured spacing from each other',
    towns.every((a, i) =>
      towns.every(
        (b, j) => i === j || (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) > 14 * 14,
      ),
    ),
  );
}

function riverCellsAround(evaluator: PipelineEvaluator): Array<[number, number]> {
  const riverCells: Array<[number, number]> = [];
  for (let y = -64; y < 64; y++) {
    for (let x = -64; x < 64; x++) {
      if (riverCellAt(evaluator, x, y)) riverCells.push([x, y]);
    }
  }
  return riverCells;
}

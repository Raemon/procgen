import '../procgen/nodes';
import { CHUNK_SIZE } from '../procgen/chunk';
import { CARVER_CHOICES } from '../procgen/nodes/maze/mazeCarvers';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { WorldSampler } from '../procgen/worldSampler';
import type { CheckReporter } from './checkReporter';
import { tileBytes, tileIdsInRegion, worldFromState } from './pipelineWorldFixtures';

const MAZE_FLOOR = 1;

function labyrinthVariant(params: Record<string, number>): PipelineState {
  const state = sanitizePipeline(examplePipelines()[3]!.state);
  Object.assign(state.nodes[0]!.params, params);
  return state;
}

function verticalSeamDoorRuns(sampler: WorldSampler, cx: number, cy: number): number {
  let runs = 0;
  let inRun = false;
  for (let y = cy * CHUNK_SIZE; y < (cy + 1) * CHUNK_SIZE; y++) {
    const open =
      sampler.tileAt((cx + 1) * CHUNK_SIZE - 1, y) === MAZE_FLOOR &&
      sampler.tileAt((cx + 1) * CHUNK_SIZE, y) === MAZE_FLOOR;
    if (open && !inRun) runs++;
    inRun = open;
  }
  return runs;
}

function horizontalSeamDoorRuns(sampler: WorldSampler, cx: number, cy: number): number {
  let runs = 0;
  let inRun = false;
  for (let x = cx * CHUNK_SIZE; x < (cx + 1) * CHUNK_SIZE; x++) {
    const open =
      sampler.tileAt(x, (cy + 1) * CHUNK_SIZE - 1) === MAZE_FLOOR &&
      sampler.tileAt(x, (cy + 1) * CHUNK_SIZE) === MAZE_FLOOR;
    if (open && !inRun) runs++;
    inRun = open;
  }
  return runs;
}

function allSeamsCrossable(sampler: WorldSampler, chunkSpan: number): boolean {
  for (let cy = -chunkSpan; cy < chunkSpan; cy++) {
    for (let cx = -chunkSpan; cx < chunkSpan; cx++) {
      if (cx + 1 < chunkSpan && verticalSeamDoorRuns(sampler, cx, cy) === 0) return false;
      if (cy + 1 < chunkSpan && horizontalSeamDoorRuns(sampler, cx, cy) === 0) return false;
    }
  }
  return true;
}

function regionFloorsConnected(sampler: WorldSampler, minX: number, minY: number, size: number): boolean {
  const isFloor = (i: number) =>
    sampler.tileAt(minX + (i % size), minY + Math.floor(i / size)) === MAZE_FLOOR;
  const floors = Array.from({ length: size * size }, (_, i) => i).filter(isFloor);
  if (floors.length === 0) return false;
  return floodedFloorCount(floors, size) === floors.length;
}

function floodedFloorCount(floors: number[], size: number): number {
  const floorSet = new Set(floors);
  const seen = new Set([floors[0]!]);
  const queue = [floors[0]!];
  while (queue.length > 0) {
    const i = queue.pop()!;
    for (const next of gridNeighbors(i, size)) {
      if (floorSet.has(next) && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size;
}

function gridNeighbors(i: number, size: number): number[] {
  const x = i % size;
  const y = Math.floor(i / size);
  const found: number[] = [];
  if (x > 0) found.push(i - 1);
  if (x < size - 1) found.push(i + 1);
  if (y > 0) found.push(i - size);
  if (y < size - 1) found.push(i + size);
  return found;
}

type MazeWorld = ReturnType<typeof worldFromState>;

export function checkLabyrinthConnectivity(check: CheckReporter): void {
  const mazeA = worldFromState(labyrinthVariant({}));
  checkLabyrinthChunksAreDeterministicRegardlessOfEvaluationOrder(check, mazeA);
  checkEveryCorridorAndCarverCombinationStaysOneWalkableMaze(check);
  checkDoorsPerEdgeAddsExtraSeamCrossings(check);
  checkTheCorridorWidthKnobReshapesTheLabyrinth(check, mazeA);
  checkAMazeSpanningChunksIsOneLabyrinthWhicheverChunkComesFirst(check);
  checkNestedLabyrinthsShowTheInnerMazeThroughTheOuterOne(check);
}

function checkLabyrinthChunksAreDeterministicRegardlessOfEvaluationOrder(
  check: CheckReporter,
  mazeA: MazeWorld,
): void {
  const mazeB = worldFromState(labyrinthVariant({}));
  const mazeSeq = [tileBytes(mazeA.evaluator, 'n1', 0, 0), tileBytes(mazeA.evaluator, 'n1', 3, -2)];
  const mazeRev = [tileBytes(mazeB.evaluator, 'n1', 3, -2), tileBytes(mazeB.evaluator, 'n1', 0, 0)];
  check(
    'labyrinth chunks are deterministic regardless of evaluation order',
    mazeSeq[0] === mazeRev[1] && mazeSeq[1] === mazeRev[0],
  );
}

function checkEveryCorridorAndCarverCombinationStaysOneWalkableMaze(check: CheckReporter): void {
  const MAZE_SHAPES = [
    { corridor: 1, wall: 1 },
    { corridor: 2, wall: 2 },
    { corridor: 3, wall: 1 },
    { corridor: 5, wall: 2 },
    { corridor: 6, wall: 2 },
    { corridor: 7, wall: 1 },
  ];
  for (const shape of MAZE_SHAPES) {
    for (const carver of CARVER_CHOICES) {
      const combo = worldFromState(labyrinthVariant({ ...shape, carver: carver.value }));
      check(
        `labyrinth corridor ${shape.corridor} wall ${shape.wall} + ${carver.label} stays connected across all chunks and seams`,
        allSeamsCrossable(combo.sampler, 2) && regionFloorsConnected(combo.sampler, -CHUNK_SIZE, -CHUNK_SIZE, 3 * CHUNK_SIZE),
      );
    }
  }
}

function checkDoorsPerEdgeAddsExtraSeamCrossings(check: CheckReporter): void {
  const denseDoors = worldFromState(labyrinthVariant({ doorsPerEdge: 4 }));
  check(
    'doors per edge adds extra seam crossings',
    verticalSeamDoorRuns(denseDoors.sampler, 0, 0) >= 2 && horizontalSeamDoorRuns(denseDoors.sampler, 0, 0) >= 2,
  );
}

function checkTheCorridorWidthKnobReshapesTheLabyrinth(
  check: CheckReporter,
  mazeA: MazeWorld,
): void {
  check(
    'corridor width knob reshapes the labyrinth',
    tileBytes(worldFromState(labyrinthVariant({ corridor: 7 })).evaluator, 'n1', 0, 0) !==
      tileBytes(mazeA.evaluator, 'n1', 0, 0),
  );
}

function checkAMazeSpanningChunksIsOneLabyrinthWhicheverChunkComesFirst(
  check: CheckReporter,
): void {
  const bigMazeA = worldFromState(labyrinthVariant({ mazeChunks: 2, corridor: 5, wall: 3 }));
  const bigMazeB = worldFromState(labyrinthVariant({ mazeChunks: 2, corridor: 5, wall: 3 }));
  const bigSeq = [tileBytes(bigMazeA.evaluator, 'n1', 0, 0), tileBytes(bigMazeA.evaluator, 'n1', 1, 1)];
  const bigRev = [tileBytes(bigMazeB.evaluator, 'n1', 1, 1), tileBytes(bigMazeB.evaluator, 'n1', 0, 0)];
  check(
    'chunks of one multi-chunk maze agree regardless of which is generated first',
    bigSeq[0] === bigRev[1] && bigSeq[1] === bigRev[0],
  );
  check(
    'a maze spanning multiple chunks stays one connected labyrinth across regions',
    regionFloorsConnected(bigMazeA.sampler, -2 * CHUNK_SIZE, -2 * CHUNK_SIZE, 4 * CHUNK_SIZE),
  );
}

function checkNestedLabyrinthsShowTheInnerMazeThroughTheOuterOne(check: CheckReporter): void {
  const nested = worldFromState(sanitizePipeline(examplePipelines()[4]!.state));
  const nestedTiles = tileIdsInRegion(nested.sampler, 128);
  check(
    'nested labyrinths preset shows the inner hedge maze through the outer maze corridors',
    [2, 3, 4].every((id) => nestedTiles.has(id)),
  );

}

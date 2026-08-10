import '../procgen/nodes';
import { chunkExitsOf, CLOSED, type ChunkExits } from '../procgen/labyrinth/chunkExits';
import {
  LABYRINTH_NODE_TYPE,
  LABYRINTH_SEED_LABEL,
  labyrinthKnobsFrom,
  type LabyrinthKnobs,
} from '../procgen/labyrinth/labyrinthKnobs';
import { LABYRINTH_CELL_SIZE, labyrinthCellOrigin } from '../procgen/labyrinth/labyrinthLattice';
import { labelSeed } from '../procgen/random/labelSeed';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { infiniteLabyrinth } from '../procgen/presets/infiniteLabyrinth';
import type { WorldSampler } from '../procgen/worldSampler';
import type { CheckReporter } from './checkReporter';
import { tileBytes, worldFromState } from './pipelineWorldFixtures';

const SEAM_RINGS = 4;
const FLOOD_RINGS = 2;

function labyrinthState(): PipelineState {
  return sanitizePipeline(infiniteLabyrinth().state);
}

function knobsOf(state: PipelineState): LabyrinthKnobs {
  const node = state.nodes.find((candidate) => candidate.type === LABYRINTH_NODE_TYPE)!;
  return labyrinthKnobsFrom(labelSeed(state.seed, node.id, LABYRINTH_SEED_LABEL), node.params);
}

function seamCrossable(
  sampler: WorldSampler,
  cx: number,
  cy: number,
  side: keyof ChunkExits,
  offset: number,
  floorTile: number,
): boolean {
  if (offset === CLOSED) return true;
  const [nearX, nearY, farX, farY] = seamCells(cx, cy, side, offset);
  return sampler.tileAt(nearX, nearY) === floorTile && sampler.tileAt(farX, farY) === floorTile;
}

function seamCells(
  cx: number,
  cy: number,
  side: keyof ChunkExits,
  offset: number,
): [number, number, number, number] {
  const originX = labyrinthCellOrigin(cx);
  const originY = labyrinthCellOrigin(cy);
  if (side === 'east') {
    const y = originY + offset;
    return [originX + LABYRINTH_CELL_SIZE - 1, y, originX + LABYRINTH_CELL_SIZE, y];
  }
  const x = originX + offset;
  return [x, originY + LABYRINTH_CELL_SIZE - 1, x, originY + LABYRINTH_CELL_SIZE];
}

function everySeamCrossable(sampler: WorldSampler, knobs: LabyrinthKnobs): boolean {
  for (let cy = -SEAM_RINGS; cy <= SEAM_RINGS; cy++) {
    for (let cx = -SEAM_RINGS; cx <= SEAM_RINGS; cx++) {
      const exits = chunkExitsOf(cx, cy, knobs);
      if (!seamCrossable(sampler, cx, cy, 'east', exits.east, knobs.floorTile)) return false;
      if (!seamCrossable(sampler, cx, cy, 'south', exits.south, knobs.floorTile)) return false;
    }
  }
  return true;
}

function floorsAreOneComponent(sampler: WorldSampler, knobs: LabyrinthKnobs): boolean {
  const size = (2 * FLOOD_RINGS + 1) * LABYRINTH_CELL_SIZE;
  const min = -FLOOD_RINGS * LABYRINTH_CELL_SIZE;
  const isFloor = (i: number) =>
    sampler.tileAt(min + (i % size), min + Math.floor(i / size)) === knobs.floorTile;
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

export function checkLabyrinthConnectivity(check: CheckReporter): void {
  const state = labyrinthState();
  const knobs = knobsOf(state);
  const world = worldFromState(state);
  const again = worldFromState(labyrinthState());
  const sequential = [tileBytes(world.evaluator, 'n1', 0, 0), tileBytes(world.evaluator, 'n1', 3, -2)];
  const reversed = [tileBytes(again.evaluator, 'n1', 3, -2), tileBytes(again.evaluator, 'n1', 0, 0)];
  check(
    'labyrinth chunks are deterministic regardless of evaluation order',
    sequential[0] === reversed[1] && sequential[1] === reversed[0],
  );
  check(
    'every open seam in rings 0..4 is crossable in the painted tiles, floor meeting floor through the doorway',
    everySeamCrossable(world.sampler, knobs),
  );
  check(
    'the painted floor of rings 0..2 is one flood-fill component',
    floorsAreOneComponent(world.sampler, knobs),
  );
}

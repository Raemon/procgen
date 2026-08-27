import '../nodes';
import { chunkExitsOf, CLOSED, type ChunkExits } from '../labyrinth/chunkExits';
import {
  LABYRINTH_NODE_TYPE,
  LABYRINTH_SEED_LABEL,
  labyrinthKnobsFrom,
  type LabyrinthKnobs,
} from '../labyrinth/labyrinthKnobs';
import { LABYRINTH_CELL_SIZE, labyrinthCellOrigin } from '../labyrinth/labyrinthLattice';
import { labelSeed } from '../random/labelSeed';
import type { PipelineState } from '../pipeline/pipelineState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { infiniteLabyrinth } from '../presets/infiniteLabyrinth';
import type { WorldSampler } from '../worldSampler';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { stateOfNodes, tileAtNode, tileBytes, worldFromState } from './pipelineWorldFixtures';
import { EMPTY_TILE } from '../values/chunkValues';

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

const MASK_SCRIPT = `const field = ctx.newField();
for (let y = 0; y < ctx.size; y++) {
  for (let x = 0; x < ctx.size; x++) {
    const worldX = ctx.originX + x;
    const worldY = ctx.originY + y;
    const westRoom = worldX >= 0 && worldX <= 64 && worldY >= 0 && worldY <= 64;
    const eastRoom = worldX >= 192 && worldX <= 256 && worldY >= 0 && worldY <= 64;
    const corridor = worldX >= 64 && worldX <= 192 && worldY >= 24 && worldY <= 40;
    field[y * ctx.size + x] = westRoom || eastRoom || corridor ? 1 : 0;
  }
}
return field;`;

const MASK_FLOOR = 1;
const MASK_WALL = 2;
const MASKED_WINDOW = { minX: -32, minY: -32, maxX: 288, maxY: 96 };

function maskedMazeState(): PipelineState {
  return stateOfNodes([
    { id: 'mask', type: 'customScript', params: { outputKind: 'field', code: MASK_SCRIPT }, inputs: {} },
    {
      id: 'maze',
      type: 'mazeChunk',
      params: {
        corridor: 3,
        wall: 1,
        mazeChunks: 1,
        braid: 0.15,
        doorsPerEdge: 1,
        maskAtLeast: 0.5,
        wallTile: MASK_WALL,
        floorTile: MASK_FLOOR,
      },
      inputs: { mask: 'mask' },
    },
  ]);
}

function maskedTiles(): number[] {
  const world = worldFromState(maskedMazeState());
  const tiles: number[] = [];
  for (let y = MASKED_WINDOW.minY; y < MASKED_WINDOW.maxY; y++) {
    for (let x = MASKED_WINDOW.minX; x < MASKED_WINDOW.maxX; x++) {
      tiles.push(tileAtNode(world.evaluator, 'maze', x, y));
    }
  }
  return tiles;
}

function checkAMaskedLabyrinthStaysOnePlace(check: CheckReporter): void {
  const tiles = maskedTiles();
  const width = MASKED_WINDOW.maxX - MASKED_WINDOW.minX;
  const floors = tiles.map((tile, at) => (tile === MASK_FLOOR ? at : -1)).filter((at) => at >= 0);
  check(
    'the masked labyrinth carves floor inside the mask and leaves the world outside it empty',
    floors.length > 0 && tiles.some((tile) => tile === EMPTY_TILE) && tiles.some((tile) => tile === MASK_WALL),
  );
  check(
    'nothing is carved where the mask says the labyrinth is not',
    tileAtNode(worldFromState(maskedMazeState()).evaluator, 'maze', 128, 80) === EMPTY_TILE,
  );
  check(
    'the floor of a masked labyrinth is one flood-fill component, so the two rooms its corridor joins really are joined',
    floodedFloorCount(floors, width) === floors.length,
  );
}

export function checkLabyrinthConnectivity(check: CheckReporter): void {
  checkAMaskedLabyrinthStaysOnePlace(check);
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

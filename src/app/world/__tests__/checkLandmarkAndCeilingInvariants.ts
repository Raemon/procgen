import { CHUNK_SIZE } from '../procgen/chunk';
import {
  DEFAULT_CEILING_HEIGHT,
  displayModesForKind,
} from '../procgen/display/displayBinding';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import type { NodeInstance, PipelineState } from '../procgen/pipeline/pipelineState';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import { asPoints, asTiles } from '../procgen/values/valueAccess';
import { WorldSampler } from '../procgen/worldSampler';
import { TileAssets } from '../assets/tiles/tileAssets';
import type { CheckReporter } from './checkReporter';

const FLOOR_TILE = 15;
const WALL_TILE = 17;
const ROOF_TILE = 4;

export function checkLandmarkAndCeilingInvariants(check: CheckReporter): void {
  checkLandmarkRoomStampsWhereItSays(check);
  checkLandmarkPointDropsOnePointOnly(check);
  checkMazeRoomsOpenChambersDeterministically(check);
  checkCeilingsHangAboveWithoutTouchingTheGround(check);
}

function checkLandmarkRoomStampsWhereItSays(check: CheckReporter): void {
  const { sampler } = worldOf([
    landmarkRoomNode({ x: 0, y: 0, width: 5, height: 3, wallThickness: 1 }),
  ]);
  check(
    'a landmark room floors exactly the rectangle it was given',
    sampler.tileAt(2, 1) === FLOOR_TILE &&
      sampler.tileAt(-2, -1) === FLOOR_TILE &&
      sampler.tileAt(3, 0) === WALL_TILE &&
      sampler.tileAt(0, 2) === WALL_TILE &&
      sampler.tileAt(4, 0) === EMPTY_TILE,
  );
  const far = worldOf([landmarkRoomNode({ x: 70, y: -40, width: 7, height: 7, wallThickness: 0 })]);
  check(
    'a landmark room lands in whichever chunk holds its coordinates, and nowhere else',
    far.sampler.tileAt(70, -40) === FLOOR_TILE && far.sampler.tileAt(0, 0) === EMPTY_TILE,
  );
  check(
    'a landmark room is the same however its chunks are visited',
    chunkTilesInBothOrders(worldOf([landmarkRoomNode({ x: 0, y: 0 })]).evaluator),
  );
}

function checkLandmarkPointDropsOnePointOnly(check: CheckReporter): void {
  const { evaluator } = worldOf([landmarkPointNode(2, 0)]);
  const home = asPoints(evaluator.valueFor('n1', 0, 0)) ?? [];
  const elsewhere = asPoints(evaluator.valueFor('n1', 1, 0)) ?? [];
  check(
    'a landmark point puts exactly one tagged point at the coordinates it was given',
    home.length === 1 && home[0]!.x === 2 && home[0]!.y === 0 && elsewhere.length === 0,
  );
}

function checkMazeRoomsOpenChambersDeterministically(check: CheckReporter): void {
  const corridorsOnly = worldOf([mazeNode(0)]);
  const withRooms = worldOf([mazeNode(0.4)]);
  check(
    'the rooms knob opens chambers wider than the corridors around them',
    largestOpenSquare(corridorsOnly.sampler) <= 3 && largestOpenSquare(withRooms.sampler) >= 5,
  );
  check(
    'a labyrinth with rooms is the same however its chunks are visited',
    chunkTilesInBothOrders(worldOf([mazeNode(0.4)]).evaluator),
  );
  check(
    'rooms only ever open walls, never seal a corridor shut',
    everyFloorOfTheCorridorMazeStaysOpen(corridorsOnly.sampler, withRooms.sampler),
  );
}

function checkCeilingsHangAboveWithoutTouchingTheGround(check: CheckReporter): void {
  check(
    'a tiles node may be drawn as a tile layer or as a ceiling',
    displayModesForKind('tiles').includes('ceiling') && !displayModesForKind('field').includes('ceiling'),
  );
  const { sampler } = worldOf([roofNode()]);
  check(
    'a node bound to ceiling roofs the world without painting anything on the floor',
    sampler.ceilingTileAt(0, 0) === ROOF_TILE &&
      sampler.ceilingHeightAt(0, 0) === 5 &&
      sampler.tileAt(0, 0) === EMPTY_TILE &&
      sampler.ceilingTileAt(4, 4) === ROOF_TILE &&
      sampler.ceilingTileAt(9, 9) === EMPTY_TILE,
  );
  check(
    'a stored ceiling height survives a save and load, and junk falls back to the default',
    sanitizePipeline({
      seed: 1,
      nodes: [{ ...landmarkRoomNode({}), display: { mode: 'ceiling', height: 7 } }],
    }).nodes[0]!.display.mode === 'ceiling' &&
      (sanitizePipeline({
        seed: 1,
        nodes: [{ ...landmarkRoomNode({}), display: { mode: 'ceiling', height: 'high' } }],
      }).nodes[0]!.display as { height: number }).height === DEFAULT_CEILING_HEIGHT,
  );
}

function roofNode(): NodeInstance {
  return {
    ...landmarkRoomNode({ x: 0, y: 0, width: 9, height: 9, wallThickness: 0 }),
    params: { x: 0, y: 0, width: 9, height: 9, wallThickness: 0, floorTile: ROOF_TILE, wallTile: -1 },
    display: { mode: 'ceiling', height: 5 },
  };
}

function landmarkRoomNode(params: Record<string, number>): NodeInstance {
  return {
    id: 'n1',
    type: 'landmarkRoom',
    label: 'room',
    comment: '',
    folder: '',
    enabled: true,
    params: {
      x: 0,
      y: 0,
      width: 11,
      height: 11,
      wallThickness: 0,
      floorTile: FLOOR_TILE,
      wallTile: WALL_TILE,
      ...params,
    },
    inputs: {},
    display: { mode: 'tileLayer' },
  };
}

function landmarkPointNode(x: number, y: number): NodeInstance {
  return {
    id: 'n1',
    type: 'landmarkPoint',
    label: 'landmark',
    comment: '',
    folder: '',
    enabled: true,
    params: { x, y },
    inputs: {},
    display: { mode: 'markers', tileId: -1, glyph: '*', color: '#ffffff' },
  };
}

function mazeNode(rooms: number): NodeInstance {
  return {
    id: 'n1',
    type: 'mazeChunk',
    label: 'labyrinth',
    comment: '',
    folder: '',
    enabled: true,
    params: {
      corridor: 3,
      wall: 1,
      mazeChunks: 1,
      carver: 0,
      braid: 0.15,
      doorsPerEdge: 1,
      rooms,
      roomCells: 3,
      wallTile: WALL_TILE,
      floorTile: FLOOR_TILE,
    },
    inputs: {},
    display: { mode: 'tileLayer' },
  };
}

function worldOf(nodes: NodeInstance[]) {
  const state: PipelineState = sanitizePipeline({ seed: 7, nodes });
  const store = new PipelineStore(state);
  const evaluator = new PipelineEvaluator(store);
  return { store, evaluator, sampler: new WorldSampler(store, evaluator, new TileAssets()) };
}

function chunkTilesInBothOrders(evaluator: PipelineEvaluator): boolean {
  const forward = [tilesOf(evaluator, 0, 0), tilesOf(evaluator, 2, -1)];
  const backward = [tilesOf(evaluator, 2, -1), tilesOf(evaluator, 0, 0)];
  return forward[0] === backward[1] && forward[1] === backward[0];
}

function tilesOf(evaluator: PipelineEvaluator, chunkX: number, chunkY: number): string {
  return JSON.stringify(Array.from(asTiles(evaluator.valueFor('n1', chunkX, chunkY)) ?? []));
}

function largestOpenSquare(sampler: WorldSampler): number {
  let largest = 0;
  for (let y = 0; y < CHUNK_SIZE; y++) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      while (isOpenSquare(sampler, x, y, largest + 1)) largest++;
    }
  }
  return largest;
}

function isOpenSquare(sampler: WorldSampler, x: number, y: number, side: number): boolean {
  if (x + side > CHUNK_SIZE || y + side > CHUNK_SIZE) return false;
  for (let row = 0; row < side; row++) {
    for (let column = 0; column < side; column++) {
      if (sampler.tileAt(x + column, y + row) !== FLOOR_TILE) return false;
    }
  }
  return true;
}

function everyFloorOfTheCorridorMazeStaysOpen(
  corridorsOnly: WorldSampler,
  withRooms: WorldSampler,
): boolean {
  for (let y = 0; y < CHUNK_SIZE; y++) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      const wasFloor = corridorsOnly.tileAt(x, y) === FLOOR_TILE;
      if (wasFloor && withRooms.tileAt(x, y) !== FLOOR_TILE) return false;
    }
  }
  return true;
}

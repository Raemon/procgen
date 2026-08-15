import '../nodes';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { newTileWithId, type TileDef } from '@/features/asset-library/tiles/tileDef';
import { PipelineEvaluator } from '../eval/evaluator';
import type { PipelineState } from '../pipeline/pipelineState';
import { PipelineStore } from '../pipeline/pipelineStore';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { WorldSampler } from '../worldSampler';

export const FLOOR_TILE = 0;
export const WALL_TILE = 1;
export const WATER_TILE = 2;
export const SAND_TILE = 3;
export const GRASS_TILE = 4;
export const FOREST_TILE = 5;
export const RIDGE_TILE = 6;

export const fixtureTileAssets = new TileAssets([
  fixtureTile(FLOOR_TILE, 'flagstone', '#8a8a86', true, 1),
  fixtureTile(WALL_TILE, 'wall', '#4a4550', false, 3),
  fixtureTile(WATER_TILE, 'water', '#33546b', false, 1),
  fixtureTile(SAND_TILE, 'sand', '#c9b892', true, 1),
  fixtureTile(GRASS_TILE, 'grass', '#6d8a55', true, 1),
  fixtureTile(FOREST_TILE, 'forest', '#2f5a33', false, 3),
  fixtureTile(RIDGE_TILE, 'ridge', '#7a6a5a', false, 3),
]);

export function samplerOfState(state: PipelineState): WorldSampler {
  const store = new PipelineStore(state);
  return new WorldSampler(store, new PipelineEvaluator(store), fixtureTileAssets);
}

export function openPlainState(): PipelineState {
  return sanitizePipeline({
    seed: 11,
    nodes: [
      fixtureNode('n1', 'constantField', 'flat ground', { value: 1 }, {}),
      thresholdNode('n2', 'n1', 'everything is grass', 0.5, GRASS_TILE, GRASS_TILE),
    ],
  });
}

export function cloneCorridorMazeState(): PipelineState {
  return sanitizePipeline({
    seed: 12,
    nodes: [
      fixtureNode(
        'n1',
        'mazeChunk',
        'identical corridors',
        { corridor: 1, wall: 1, mazeChunks: 1, braid: 0, doorsPerEdge: 1, rooms: 0, wallTile: WALL_TILE, floorTile: FLOOR_TILE },
        {},
      ),
    ],
  });
}

const STATIC_NOISE_SCRIPT = `const tiles = ctx.newTiles();
const palette = [0, 2, 3, 4, 5];
for (let i = 0; i < tiles.length; i++) {
  const x = ctx.originX + (i % ctx.size);
  const y = ctx.originY + Math.floor(i / ctx.size);
  tiles[i] = palette[Math.floor(ctx.hash01(x, y, 'static') * palette.length)];
}
return tiles;`;

export function staticNoiseState(): PipelineState {
  return sanitizePipeline({
    seed: 14,
    nodes: [
      {
        id: 'n1',
        type: 'customScript',
        label: 'television static',
        enabled: true,
        params: { outputKind: 'tiles', code: STATIC_NOISE_SCRIPT },
        inputs: {},
        display: { mode: 'tileLayer' },
      },
    ],
  });
}

export function populatedVariedState(): PipelineState {
  const state = variedStructuredState();
  return sanitizePipeline({
    ...state,
    nodes: [
      ...state.nodes,
      scatterMarkersNode('n9', 'wayshrines', 0.006, 0.42, 0.6, '✶', '#e0b040'),
      scatterMarkersNode('n10', 'standing stones', 0.005, 0.52, 0.62, '▲', '#c2c2c2'),
      scatterMarkersNode('n11', 'springs', 0.006, 0.36, 0.45, '◆', '#3fbf9f'),
    ],
  });
}

function scatterMarkersNode(
  id: string,
  label: string,
  density: number,
  maskAtLeast: number,
  maskAtMost: number,
  glyph: string,
  color: string,
) {
  return {
    id,
    type: 'scatterPoints',
    label,
    enabled: true,
    params: { density, maskAtLeast, maskAtMost },
    inputs: { mask: 'n3' },
    display: { mode: 'markers', tileId: -1, glyph, color },
  };
}

export function variedStructuredState(): PipelineState {
  return sanitizePipeline({
    seed: 13,
    nodes: [
      fixtureNode('n1', 'noiseField', 'continents', { scale: 0.02, octaves: 4 }, {}),
      fixtureNode('n2', 'noiseField', 'detail', { scale: 0.09, octaves: 3 }, {}),
      fixtureNode('n3', 'combineFields', 'relief', { operation: 5, clamp: 1 }, { a: 'n1', b: 'n2' }),
      thresholdNode('n4', 'n3', 'sea', 0.4, WATER_TILE, SAND_TILE),
      thresholdNode('n5', 'n3', 'meadows', 0.435, -1, GRASS_TILE),
      thresholdNode('n6', 'n3', 'woods', 0.545, -1, FOREST_TILE),
      thresholdNode('n7', 'n3', 'ridges', 0.6, -1, RIDGE_TILE),
      thresholdNode('n8', 'n2', 'clearings', 0.62, -1, FLOOR_TILE),
    ],
  });
}

const TERRACE_SCRIPT = `const field = ctx.newField();
const TERRACE_SPAN = 16;
const LEVELS = 4;
const PASS_EVERY = 24;
const PASS_WIDTH = 4;
for (let i = 0; i < field.length; i++) {
  const x = ctx.originX + (i % ctx.size);
  const y = ctx.originY + Math.floor(i / ctx.size);
  const along = ((x % (TERRACE_SPAN * LEVELS)) + TERRACE_SPAN * LEVELS) % (TERRACE_SPAN * LEVELS);
  const smooth = along / (TERRACE_SPAN * LEVELS);
  const stepped = Math.floor(along / TERRACE_SPAN) / (LEVELS - 1);
  const onPass = ((y % PASS_EVERY) + PASS_EVERY) % PASS_EVERY < PASS_WIDTH;
  field[i] = onPass ? smooth : Math.min(1, stepped);
}
return field;`;

export function terracedHighlandState(): PipelineState {
  return sanitizePipeline({
    seed: 15,
    nodes: [
      {
        id: 'n1',
        type: 'customScript',
        label: 'terraces',
        enabled: true,
        params: { outputKind: 'field', code: TERRACE_SCRIPT },
        inputs: {},
        display: { mode: 'elevation', heightScale: 6 },
      },
      thresholdNode('n2', 'n1', 'meadow floor', 0.55, GRASS_TILE, SAND_TILE),
    ],
  });
}

function fixtureTile(
  id: number,
  name: string,
  color: string,
  walkable: boolean,
  height: number,
): TileDef {
  return { ...newTileWithId(id), name, symbol: name[0]!, color, walkable, height };
}

function fixtureNode(
  id: string,
  type: string,
  label: string,
  params: Record<string, number>,
  inputs: Record<string, string>,
) {
  return { id, type, label, enabled: true, params, inputs };
}

function thresholdNode(
  id: string,
  sourceId: string,
  label: string,
  threshold: number,
  belowTile: number,
  aboveTile: number,
) {
  return fixtureNode(id, 'thresholdTiles', label, { threshold, belowTile, aboveTile }, { source: sourceId });
}

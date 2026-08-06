import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import '../../procgen/nodes';
import { PipelineEvaluator } from '../../procgen/eval/evaluator';
import { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';
import { WorldSampler } from '../../procgen/worldSampler';
import { nearestWalkable } from '../../world/nearestWalkable';
import { isWalkableTile } from '../../world/tileWalkability';
import { Tileset } from '../../world/tiles/tileset';
import { tilesFromStoredJson } from '../../world/tiles/tilesetStorage';

const SPAWN_SEARCH_RADIUS = 128;

export interface ServerWorld {
  stamp: string;
  sampler: WorldSampler;
  tileset: Tileset;
  store: PipelineStore;
  isWalkable(x: number, y: number): boolean;
  spawn(): { x: number; y: number };
}

export interface WorldAccess {
  current(): ServerWorld;
  persistPipeline(world: ServerWorld): void;
}

export function persistPipeline(root: string, world: ServerWorld): void {
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(
    dataFilePath(root, 'pipeline'),
    JSON.stringify(world.store.snapshot(), null, 2) + '\n',
  );
}

export function currentServerWorld(root: string, previous: ServerWorld | null): ServerWorld {
  const stamp = dataFileStamp(root);
  if (previous && previous.stamp === stamp) return previous;
  return buildServerWorld(root, stamp);
}

function buildServerWorld(root: string, stamp: string): ServerWorld {
  const tileset = new Tileset(tilesFromStoredJson(dataFileJson(root, 'tileset')) ?? undefined);
  const store = new PipelineStore(sanitizePipeline(dataFileJson(root, 'pipeline')));
  const evaluator = new PipelineEvaluator(store);
  const sampler = new WorldSampler(store, evaluator, tileset);
  const isWalkable = (x: number, y: number) => isWalkableTile(tileset, sampler.tileAt(x, y));
  return {
    stamp,
    sampler,
    tileset,
    store,
    isWalkable,
    spawn: () => nearestWalkable(0, 0, SPAWN_SEARCH_RADIUS, isWalkable) ?? { x: 0, y: 0 },
  };
}

function dataFileStamp(root: string): string {
  return ['pipeline', 'tileset'].map((name) => String(dataFileMtime(root, name))).join('|');
}

function dataFileMtime(root: string, name: string): number {
  const path = dataFilePath(root, name);
  return existsSync(path) ? statSync(path).mtimeMs : 0;
}

function dataFileJson(root: string, name: string): unknown {
  const path = dataFilePath(root, name);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function dataFilePath(root: string, name: string): string {
  return join(root, 'data', `${name}.json`);
}

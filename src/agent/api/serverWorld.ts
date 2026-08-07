import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import '../../procgen/nodes';
import { CreatureLibrary } from '../../creatures/creatureLibrary';
import { creaturesFromStoredJson } from '../../creatures/creatureStorage';
import { ItemLibrary } from '../../items/itemLibrary';
import { itemsFromStoredJson } from '../../items/itemStorage';
import { PrefabLibrary } from '../../prefabs/prefabLibrary';
import { prefabsFromStoredJson } from '../../prefabs/prefabStorage';
import { PipelineEvaluator } from '../../procgen/eval/evaluator';
import { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { WorldPresetLibrary } from '../../procgen/presets/worldPresetLibrary';
import { RandomizeHistory } from '../../procgen/randomize/randomizeHistory';
import { TemplateLibrary } from '../../procgen/templates/templateLibrary';
import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';
import { WorldSampler } from '../../procgen/worldSampler';
import { nearestWalkable } from '../../world/nearestWalkable';
import { isWalkableTile } from '../../world/tileWalkability';
import { Tileset } from '../../world/tiles/tileset';
import { tilesFromStoredJson } from '../../world/tiles/tilesetStorage';
import { sanitizeTemplates } from '../../procgen/templates/nodeTemplate';
import { sanitizeWorldPresets } from '../../procgen/presets/worldPreset';

const SPAWN_SEARCH_RADIUS = 128;

export interface ServerWorld {
  stamp: string;
  sampler: WorldSampler;
  tileset: Tileset;
  store: PipelineStore;
  prefabs: PrefabLibrary;
  creatures: CreatureLibrary;
  items: ItemLibrary;
  templates: TemplateLibrary;
  worldPresets: WorldPresetLibrary;
  randomizeHistory: RandomizeHistory;
  isWalkable(x: number, y: number): boolean;
  spawn(): { x: number; y: number };
}

export interface WorldAccess {
  current(): ServerWorld;
  persistWorld(world: ServerWorld): void;
}

export function persistWorld(root: string, world: ServerWorld): void {
  mkdirSync(join(root, 'data'), { recursive: true });
  writeDataFile(root, 'pipeline', world.store.snapshot());
  writeDataFile(root, 'tileset', world.tileset.all());
  writeDataFile(root, 'prefabs', world.prefabs.all());
  writeDataFile(root, 'creatures', world.creatures.all());
  writeDataFile(root, 'items', world.items.all());
  writeDataFile(root, 'templates', world.templates.savedTemplates());
  writeDataFile(root, 'worldPresets', world.worldPresets.savedPresets());
}

function writeDataFile(root: string, name: string, value: unknown): void {
  writeFileSync(dataFilePath(root, name), JSON.stringify(value, null, 2) + '\n');
}

export function currentServerWorld(root: string, previous: ServerWorld | null): ServerWorld {
  const stamp = dataFileStamp(root);
  if (previous && previous.stamp === stamp) return previous;
  return buildServerWorld(root, stamp, previous?.randomizeHistory ?? new RandomizeHistory());
}

function buildServerWorld(
  root: string,
  stamp: string,
  randomizeHistory: RandomizeHistory,
): ServerWorld {
  const tileset = new Tileset(tilesFromStoredJson(dataFileJson(root, 'tileset')) ?? undefined);
  const tileIdByName = (name: string) => tileset.all().find((tile) => tile.name === name)?.id ?? -1;
  const prefabs = new PrefabLibrary(
    tileIdByName,
    prefabsFromStoredJson(dataFileJson(root, 'prefabs')) ?? undefined,
  );
  const creatures = new CreatureLibrary(
    creaturesFromStoredJson(dataFileJson(root, 'creatures')) ?? undefined,
  );
  const items = new ItemLibrary(itemsFromStoredJson(dataFileJson(root, 'items')) ?? undefined);
  const templates = new TemplateLibrary(sanitizeTemplates(dataFileJson(root, 'templates')));
  const worldPresets = new WorldPresetLibrary(sanitizeWorldPresets(dataFileJson(root, 'worldPresets')));
  const store = new PipelineStore(sanitizePipeline(dataFileJson(root, 'pipeline')));
  const evaluator = new PipelineEvaluator(store);
  const sampler = new WorldSampler(store, evaluator, tileset, prefabs, items);
  const isWalkable = (x: number, y: number) => isWalkableTile(tileset, sampler.tileAt(x, y));
  return {
    stamp,
    sampler,
    tileset,
    store,
    prefabs,
    creatures,
    items,
    templates,
    worldPresets,
    randomizeHistory,
    isWalkable,
    spawn: () => nearestWalkable(0, 0, SPAWN_SEARCH_RADIUS, isWalkable) ?? { x: 0, y: 0 },
  };
}

function dataFileStamp(root: string): string {
  return ['pipeline', 'tileset', 'prefabs', 'creatures', 'items', 'templates', 'worldPresets']
    .map((name) => String(dataFileMtime(root, name)))
    .join('|');
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

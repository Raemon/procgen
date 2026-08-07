import '../../procgen/nodes';
import { CreatureLibrary } from '../../creatures/creatureLibrary';
import { creaturesFromStoredJson } from '../../creatures/creatureStorage';
import { ItemLibrary } from '../../items/itemLibrary';
import { groundItemsOf, type GroundItems } from '../../items/pickups/groundItems';
import { TakenItemSpawns } from '../../items/pickups/takenItemSpawns';
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
  takenItems: TakenItemSpawns;
  groundItems: GroundItems;
  isWalkable(x: number, y: number): boolean;
  spawn(): { x: number; y: number };
}

export interface WorldAccess {
  current(): ServerWorld;
  persistWorld(world: ServerWorld): void;
}

/** Reads persisted docs. `stamp` changes whenever any doc does, so a cached world knows to rebuild. */
export interface DocSource {
  read(name: string): unknown;
  stamp(): string;
}

export interface DocSink {
  write(name: string, json: unknown): void;
}

export function persistWorld(docs: DocSink, world: ServerWorld): void {
  docs.write('pipeline', world.store.snapshot());
  docs.write('tileset', world.tileset.all());
  docs.write('prefabs', world.prefabs.all());
  docs.write('creatures', world.creatures.all());
  docs.write('items', world.items.all());
  docs.write('templates', world.templates.savedTemplates());
  docs.write('worldPresets', world.worldPresets.savedPresets());
}

export function currentServerWorld(docs: DocSource, previous: ServerWorld | null): ServerWorld {
  const stamp = docs.stamp();
  if (previous && previous.stamp === stamp) return previous;
  return buildServerWorld(
    docs,
    stamp,
    previous?.randomizeHistory ?? new RandomizeHistory(),
    previous?.takenItems ?? new TakenItemSpawns(),
  );
}

function buildServerWorld(
  docs: DocSource,
  stamp: string,
  randomizeHistory: RandomizeHistory,
  takenItems: TakenItemSpawns,
): ServerWorld {
  const tileset = new Tileset(tilesFromStoredJson(docs.read('tileset')) ?? undefined);
  const tileIdByName = (name: string) => tileset.all().find((tile) => tile.name === name)?.id ?? -1;
  const prefabs = new PrefabLibrary(
    tileIdByName,
    prefabsFromStoredJson(docs.read('prefabs')) ?? undefined,
  );
  const creatures = new CreatureLibrary(
    creaturesFromStoredJson(docs.read('creatures')) ?? undefined,
  );
  const items = new ItemLibrary(itemsFromStoredJson(docs.read('items')) ?? undefined);
  const templates = new TemplateLibrary(sanitizeTemplates(docs.read('templates')));
  const worldPresets = new WorldPresetLibrary(sanitizeWorldPresets(docs.read('worldPresets')));
  const store = new PipelineStore(sanitizePipeline(docs.read('pipeline')));
  const evaluator = new PipelineEvaluator(store);
  const sampler = new WorldSampler(store, evaluator, tileset, prefabs, items, takenItems);
  const isWalkable = (x: number, y: number) => isWalkableTile(tileset, sampler.tileAt(x, y));
  return {
    stamp,
    sampler,
    groundItems: groundItemsOf(sampler, takenItems),
    tileset,
    store,
    prefabs,
    creatures,
    items,
    templates,
    worldPresets,
    randomizeHistory,
    takenItems,
    isWalkable,
    spawn: () => nearestWalkable(0, 0, SPAWN_SEARCH_RADIUS, isWalkable) ?? { x: 0, y: 0 },
  };
}


import '../../procgen/nodes';
import { CreatureAssets } from '../../assets/creatures/creatureAssets';
import { creaturesAsStoredJson, creaturesFromStoredJson } from '../../assets/creatures/creatureStorage';
import { ItemAssets } from '../../assets/items/itemAssets';
import { groundItemsOf, type GroundItems } from '../../assets/items/pickups/groundItems';
import { TakenItemSpawns } from '../../assets/items/pickups/takenItemSpawns';
import { itemsAsStoredJson, itemsFromStoredJson } from '../../assets/items/itemStorage';
import { CultureAssets } from '../../assets/cultures/cultureAssets';
import { culturesFromStoredJson } from '../../assets/cultures/cultureStorage';
import { PieceAssets } from '../../assets/pieces/pieceAssets';
import { piecesFromStoredJson } from '../../assets/pieces/pieceStorage';
import { PipelineEvaluator } from '../../procgen/eval/evaluator';
import { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { WorldPresetLibrary } from '../../procgen/presets/worldPresetLibrary';
import { RandomizeHistory } from '../../procgen/randomize/randomizeHistory';
import { TemplateLibrary } from '../../procgen/templates/templateLibrary';
import { loadOnly } from '../../procgen/persistence/persistedCollection';
import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';
import { WorldSampler } from '../../procgen/worldSampler';
import { nearestWalkable } from '../../world/nearestWalkable';
import type { StepRules } from '../../world/sim/stepIsAllowed';
import { PuzzleWorld } from '../../world/puzzles/puzzleWorld';
import { PuzzleState } from '../../world/puzzles/state/puzzleState';
import { isWalkableTile } from '../../world/tileWalkability';
import { TileAssets } from '../../assets/tiles/tileAssets';
import { tilesAsStoredJson, tilesFromStoredJson } from '../../assets/tiles/tileStorage';
import { sanitizeTemplates } from '../../procgen/templates/nodeTemplate';
import { sanitizeWorldPresets } from '../../procgen/presets/worldPreset';

const SPAWN_SEARCH_RADIUS = 128;

export interface ServerWorld {
  stamp: string;
  sampler: WorldSampler;
  tileAssets: TileAssets;
  store: PipelineStore;
  pieces: PieceAssets;
  cultures: CultureAssets;
  creatures: CreatureAssets;
  items: ItemAssets;
  templates: TemplateLibrary;
  worldPresets: WorldPresetLibrary;
  randomizeHistory: RandomizeHistory;
  takenItems: TakenItemSpawns;
  groundItems: GroundItems;
  puzzles: PuzzleWorld;
  isWalkable(x: number, y: number): boolean;
  stepRules: StepRules;
  spawn(): { x: number; y: number };
}

export interface WorldAccess {
  current(): ServerWorld;
  persistWorld(world: ServerWorld): void;
}

export interface DocSource {
  read(name: string): unknown;
  stamp(): string;
}

export interface DocSink {
  write(name: string, json: unknown): void;
}

export function persistWorld(docs: DocSink, world: ServerWorld): void {
  docs.write('pipeline', world.store.snapshot());
  docs.write('tiles', tilesAsStoredJson(world.tileAssets.all()));
  docs.write('pieces', world.pieces.all());
  docs.write('cultures', world.cultures.all());
  docs.write('creatures', creaturesAsStoredJson(world.creatures.all()));
  docs.write('items', itemsAsStoredJson(world.items.all()));
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
    previous?.puzzles.state ?? new PuzzleState(),
  );
}

function buildServerWorld(
  docs: DocSource,
  stamp: string,
  randomizeHistory: RandomizeHistory,
  takenItems: TakenItemSpawns,
  puzzleState: PuzzleState,
): ServerWorld {
  const tileAssets = new TileAssets(tilesFromStoredJson(docs.read('tiles')) ?? undefined);
  const pieces = new PieceAssets(piecesFromStoredJson(docs.read('pieces')) ?? undefined);
  const cultures = new CultureAssets(culturesFromStoredJson(docs.read('cultures')) ?? undefined);
  const creatures = new CreatureAssets(
    creaturesFromStoredJson(docs.read('creatures')) ?? undefined,
  );
  const items = new ItemAssets(itemsFromStoredJson(docs.read('items')) ?? undefined);
  const templates = new TemplateLibrary(loadOnly(() => sanitizeTemplates(docs.read('templates'))));
  const worldPresets = new WorldPresetLibrary(
    loadOnly(() => sanitizeWorldPresets(docs.read('worldPresets'))),
  );
  const store = new PipelineStore(sanitizePipeline(docs.read('pipeline')));
  const evaluator = new PipelineEvaluator(store);
  const sampler = new WorldSampler(
    store,
    evaluator,
    tileAssets,
    pieces,
    items,
    takenItems,
    cultures,
  );
  const tileIsWalkable = (x: number, y: number) => isWalkableTile(tileAssets, sampler.tileAt(x, y));
  const puzzles = new PuzzleWorld(store, tileIsWalkable, puzzleState);
  const isWalkable = (x: number, y: number) => tileIsWalkable(x, y) && !puzzles.blocksAt(x, y);
  return {
    stamp,
    sampler,
    puzzles,
    groundItems: groundItemsOf(sampler, takenItems),
    tileAssets,
    store,
    pieces,
    cultures,
    creatures,
    items,
    templates,
    worldPresets,
    randomizeHistory,
    takenItems,
    isWalkable,
    stepRules: {
      isWalkableAt: tileIsWalkable,
      clearTheWay: (x, y, dx, dy, mayPush) => puzzles.clearTheWay(x, y, dx, dy, mayPush),
    },
    spawn: () => nearestWalkable(0, 0, SPAWN_SEARCH_RADIUS, isWalkable) ?? { x: 0, y: 0 },
  };
}


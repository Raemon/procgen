import '@/features/asset-library/worlds/nodes';
import { climbGateFrom, standableProbeFrom } from '@/features/game/climbing';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { creaturesAsStoredJson, creaturesFromStoredJson } from '@/features/asset-library/creatures/creatureStorage';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import { groundItemsOf, type GroundItems } from '@/features/asset-library/items/pickups/groundItems';
import { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';
import { itemsAsStoredJson, itemsFromStoredJson } from '@/features/asset-library/items/itemStorage';
import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { culturesFromStoredJson } from '@/features/asset-library/cultures/cultureStorage';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { piecesFromStoredJson } from '@/features/asset-library/pieces/pieceStorage';
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { WorldPresetLibrary } from '@/features/asset-library/worlds/presets/worldPresetLibrary';
import { RandomizeHistory } from '@/features/asset-library/worlds/randomize/randomizeHistory';
import { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { nearestWalkable } from '@/features/game/nearestWalkable';
import type { StepRules } from '@/features/game/sim/stepIsAllowed';
import { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import { PuzzleState } from '@/features/game/puzzles/state/puzzleState';
import { isWalkableTile } from '@/features/game/tileWalkability';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { tilesAsStoredJson, tilesFromStoredJson } from '@/features/asset-library/tiles/tileStorage';
import { sanitizeTemplates } from '@/features/asset-library/node-groups/nodeTemplate';
import { worldLibraryFromStoredJson } from '@/features/asset-library/worlds/presets/storedWorldLibrary';
import { RunningWorld } from '@/features/asset-library/worlds/presets/runningWorld';
import { runningWorldNameIn } from '@/features/asset-library/worlds/presets/runningWorldStorage';

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
  runningWorld: RunningWorld;
  randomizeHistory: RandomizeHistory;
  takenItems: TakenItemSpawns;
  groundItems: GroundItems;
  puzzles: PuzzleWorld;
  isWalkable(x: number, y: number): boolean;
  isStandable(x: number, y: number): boolean;
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
  docs.write('worldPresets', world.worldPresets.stored());
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
  const templates = new TemplateLibrary(sanitizeTemplates(docs.read('templates')));
  const worldPresets = new WorldPresetLibrary(worldLibraryFromStoredJson(docs.read('worldPresets')));
  const runningWorld = new RunningWorld(runningWorldNameIn(docs.read('uiState')));
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
  const climbGate = climbGateFrom((x, y) => sampler.elevationAt(x, y));
  const isStandable = standableProbeFrom(isWalkable, climbGate);
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
    runningWorld,
    randomizeHistory,
    takenItems,
    isWalkable,
    isStandable,
    stepRules: {
      isWalkableAt: tileIsWalkable,
      clearTheWay: (x, y, dx, dy, mayPush) => puzzles.clearTheWay(x, y, dx, dy, mayPush),
      climbGateAt: climbGate,
    },
    spawn: () =>
      nearestWalkable(0, 0, SPAWN_SEARCH_RADIUS, isStandable) ??
      nearestWalkable(0, 0, SPAWN_SEARCH_RADIUS, isWalkable) ?? { x: 0, y: 0 },
  };
}


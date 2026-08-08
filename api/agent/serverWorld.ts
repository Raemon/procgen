import '../../procgen/nodes';
import type { CreatureAssets } from '../../assets/creatures/creatureAssets';
import type { ItemAssets } from '../../assets/items/itemAssets';
import { groundItemsOf, type GroundItems } from '../../assets/items/pickups/groundItems';
import { TakenItemSpawns } from '../../assets/items/pickups/takenItemSpawns';
import type { CultureAssets } from '../../assets/cultures/cultureAssets';
import type { PieceAssets } from '../../assets/pieces/pieceAssets';
import type { PipelineEvaluator } from '../../procgen/eval/evaluator';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import type { WorldPresetLibrary } from '../../procgen/presets/worldPresetLibrary';
import { RandomizeHistory } from '../../procgen/randomize/randomizeHistory';
import type { TemplateLibrary } from '../../procgen/templates/templateLibrary';
import { WorldSampler } from '../../procgen/worldSampler';
import { nearestWalkable } from '../../world/nearestWalkable';
import type { StepRules } from '../../world/sim/stepIsAllowed';
import { PuzzleWorld } from '../../world/puzzles/puzzleWorld';
import { PuzzleState } from '../../world/puzzles/state/puzzleState';
import { isWalkableTile } from '../../world/tileWalkability';
import type { TileAssets } from '../../assets/tiles/tileAssets';
import type { ServerWorldAssets } from './serverWorldAssets';

const SPAWN_SEARCH_RADIUS = 128;

export interface ServerWorld {
  stamp: string;
  sampler: WorldSampler;
  evaluator: PipelineEvaluator;
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

export interface CarriedWorldState {
  randomizeHistory: RandomizeHistory;
  takenItems: TakenItemSpawns;
  puzzleState: PuzzleState;
}

export function freshWorldState(): CarriedWorldState {
  return {
    randomizeHistory: new RandomizeHistory(),
    takenItems: new TakenItemSpawns(),
    puzzleState: new PuzzleState(),
  };
}

export function assembleServerWorld(
  stamp: string,
  assets: ServerWorldAssets,
  carried: CarriedWorldState,
): ServerWorld {
  const { store, evaluator, tileAssets, pieces, cultures, items } = assets;
  const { randomizeHistory, takenItems, puzzleState } = carried;
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
    ...assets,
    stamp,
    sampler,
    puzzles,
    groundItems: groundItemsOf(sampler, takenItems),
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

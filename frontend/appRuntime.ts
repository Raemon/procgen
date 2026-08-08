import '../abilities/index';
import { abilityFor } from '../abilities/abilityRegistry';
import { performAbility } from '../abilities/performAbility';
import type { AbilityMode, AbilityResult } from '../abilities/ability';
import { ChatComposerState } from '../world/chat/chatComposerState';
import { CreatureLibrary } from '../library/creatures/creatureLibrary';
import { ItemLibrary } from '../library/items/itemLibrary';
import { PlayerInventoryPanelState } from '../library/items/inventory/playerInventoryPanelState';
import { groundItemsOf } from '../library/items/pickups/groundItems';
import { PickupFeed } from '../library/items/pickups/pickupFeed';
import { TakenItemSpawns } from '../library/items/pickups/takenItemSpawns';
import { WalkOverPickup } from '../library/items/pickups/walkOverPickup';
import { MultiplayerSession } from '../multiplayer/client/multiplayerSession';
import { CreatureClock } from '../world/creatureSim/creatureClock';
import { CreatureSim } from '../world/creatureSim/creatureSim';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { attachPipelinePersistence, loadStoredPipeline } from '../procgen/pipeline/pipelineStorage';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import { RandomizeHistory } from '../procgen/randomize/randomizeHistory';
import { TemplateLibrary } from '../procgen/templates/templateLibrary';
import { WorldSampler } from '../procgen/worldSampler';
import { PrefabLibrary } from '../library/prefabs/prefabLibrary';
import { debounce } from './debounce';
import { CaptureTool } from '../world/capture/captureTool';
import { PuzzleWorld } from '../world/puzzles/puzzleWorld';
import { playerCanEnter } from '../world/puzzles/playerCanEnter';
import { isWalkableTile } from '../world/tileWalkability';
import { Tileset } from '../library/tiles/tileset';
import { World } from '../world/world';
import { ChangeNotifier } from './changeNotifier';
import type {
  ReadOnlyCreatureLibrary,
  ReadOnlyItemLibrary,
  ReadOnlyPipelineStore,
  ReadOnlyPrefabLibrary,
  ReadOnlyTemplateLibrary,
  ReadOnlyTileset,
  ReadOnlyWorld,
  ReadOnlyWorldPresetLibrary,
} from './readOnlyLibraries';
import { WorldRenderers } from './worldRenderers';

const VALUE_TWEAK_DEBOUNCE_MS = 150;

export interface AppRuntime {
  tileset: ReadOnlyTileset;
  prefabs: ReadOnlyPrefabLibrary;
  creatures: ReadOnlyCreatureLibrary;
  items: ReadOnlyItemLibrary;
  store: ReadOnlyPipelineStore;
  templates: ReadOnlyTemplateLibrary;
  worldPresets: ReadOnlyWorldPresetLibrary;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
  world: ReadOnlyWorld;
  net: MultiplayerSession;
  chatComposer: ChatComposerState;
  playerInventoryPanel: PlayerInventoryPanelState;
  pickupFeed: PickupFeed;
  sim: CreatureSim;
  clock: CreatureClock;
  capture: CaptureTool;
  puzzles: PuzzleWorld;
  renderers: WorldRenderers;
  perform(action: string, params?: Record<string, unknown>): AbilityResult;
  playerMode(): AbilityMode;
  setPlayerMode(mode: AbilityMode): void;
  subscribeToWorldChange(listener: () => void): () => void;
  applyWorldChange(): void;
  flushPendingTweaks(): void;
}

export function createAppRuntime(): AppRuntime {
  const tileset = new Tileset();
  const templates = new TemplateLibrary();
  const worldPresets = new WorldPresetLibrary();
  const prefabs = new PrefabLibrary((name) => tileIdByName(tileset, name));
  const creatures = new CreatureLibrary();
  const items = new ItemLibrary();
  const store = new PipelineStore(loadStoredPipeline());
  attachPipelinePersistence(store);
  const evaluator = new PipelineEvaluator(store);
  const takenItems = new TakenItemSpawns();
  const sampler = new WorldSampler(store, evaluator, tileset, prefabs, items, takenItems);
  const groundItems = groundItemsOf(sampler, takenItems);
  const tileIsWalkable = (x: number, y: number) => isWalkableTile(tileset, sampler.tileAt(x, y));
  const puzzles = new PuzzleWorld(store, tileIsWalkable);
  const isWalkableAt = (x: number, y: number) => tileIsWalkable(x, y) && !puzzles.blocksAt(x, y);
  const world = new World(isWalkableAt, (x, y, dx, dy, mayPush) =>
    puzzles.clearTheWay(x, y, dx, dy, mayPush),
  );
  const walkIntoCratesToPushThem = playerCanEnter(isWalkableAt, puzzles, () => ({
    x: world.playerX,
    y: world.playerY,
  }));
  const net = new MultiplayerSession(world, store, walkIntoCratesToPushThem);
  const chatComposer = new ChatComposerState();
  const playerInventoryPanel = new PlayerInventoryPanelState();
  const pickupFeed = new PickupFeed();
  const walkOverPickup = new WalkOverPickup({ creatures, items, groundItems }, pickupFeed);
  const sim = new CreatureSim({ sampler, library: creatures, world, isWalkableAt });
  const clock = new CreatureClock(sim);
  const renderers = new WorldRenderers();
  const worldChanged = new ChangeNotifier();
  const randomizeHistory = new RandomizeHistory();
  let playerMode: AbilityMode = 'god';
  let lastPuzzleRevision = puzzles.state.revision();

  const capture = new CaptureTool((region) =>
    perform('capture_region', {
      min_x: region.minX,
      min_y: region.minY,
      max_x: region.maxX,
      max_y: region.maxY,
    }),
  );

  function perform(action: string, params: Record<string, unknown> = {}): AbilityResult {
    const result = performAbilityOnce(action, params);
    redrawIfPuzzlesChanged();
    return result;
  }

  function redrawIfPuzzlesChanged(): void {
    if (puzzles.state.revision() === lastPuzzleRevision) return;
    lastPuzzleRevision = puzzles.state.revision();
    renderers.redrawAll();
  }

  function performAbilityOnce(
    action: string,
    params: Record<string, unknown>,
  ): AbilityResult {
    return performAbility(
      {
        store,
        tileset,
        prefabs,
        creatures,
        items,
        templates,
        worldPresets,
        randomizeHistory,
        regionSampler: sampler,
        groundItems,
        puzzles,
        actor: {
          pose: () => ({ x: world.playerX, y: world.playerY, facing: world.facing }),
          tryStep: (dx, dy, mayPush) => world.tryStep(dx, dy, mayPush),
          turn: (eighthTurns) => world.turn(eighthTurns),
          sightRadiusTiles: () => world.sightRadiusTiles,
          setSightRadiusTiles: (radius) => world.setSightRadiusTiles(radius),
        },
      },
      abilityModeFor(action),
      action,
      params,
    );
  }

  function abilityModeFor(action: string): AbilityMode {
    if (abilityFor(playerMode, action)) return playerMode;
    return isASenseOnlyTheCharacterOwns(action) ? 'character' : 'god';
  }

  function isASenseOnlyTheCharacterOwns(action: string): boolean {
    return abilityFor('character', action)?.group === 'senses';
  }

  function announceKeysTakenByWalkingOver(): void {
    for (const key of puzzles.takeKeysAt(world.playerX, world.playerY)) {
      pickupFeed.announceTaken(`${key} (a door key)`);
    }
    redrawIfPuzzlesChanged();
  }

  function applyWorldChange(): void {
    sampler.invalidatePrefabOverlay();
    sim.forget();
    world.ensurePlayerOnWalkableGround();
    renderers.redrawAll();
    worldChanged.emit();
  }

  const applyAfterTweaks = debounce(applyWorldChange, VALUE_TWEAK_DEBOUNCE_MS);
  store.onChange((change) =>
    change === 'structure' ? applyWorldChange() : applyAfterTweaks.schedule(),
  );
  tileset.onChange(applyWorldChange);
  prefabs.onChange(applyWorldChange);
  creatures.onChange(applyWorldChange);
  items.onChange(applyWorldChange);
  world.on('player-moved', () => walkOverPickup.onSteppedOnto(world.playerX, world.playerY));
  world.on('player-moved', () => announceKeysTakenByWalkingOver());
  world.on('player-moved', () => renderers.recenterAll());
  world.on('player-turned', () => renderers.recenterAll());

  return {
    tileset,
    templates,
    worldPresets,
    prefabs,
    creatures,
    items,
    store,
    evaluator,
    sampler,
    world,
    net,
    chatComposer,
    playerInventoryPanel,
    pickupFeed,
    sim,
    clock,
    capture,
    puzzles,
    renderers,
    perform,
    playerMode: () => playerMode,
    setPlayerMode: (mode) => (playerMode = mode),
    subscribeToWorldChange: worldChanged.subscribe,
    applyWorldChange,
    flushPendingTweaks: applyAfterTweaks.flushIfPending,
  };
}

function tileIdByName(tileset: Tileset, name: string): number {
  return tileset.all().find((tile) => tile.name === name)?.id ?? -1;
}

import '../abilities/index';
import { performAbility } from '../abilities/performAbility';
import { abilityFor } from '../abilities/abilityRegistry';
import type { AbilityMode, AbilityResult } from '../abilities/ability';
import { ChatComposerState } from '../chat/chatComposerState';
import { CreatureLibrary } from '../creatures/creatureLibrary';
import { ItemLibrary } from '../items/itemLibrary';
import { MultiplayerSession } from '../net/multiplayerSession';
import { CreatureClock } from '../creatures/sim/creatureClock';
import { CreatureSim } from '../creatures/sim/creatureSim';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { attachPipelinePersistence, loadStoredPipeline } from '../procgen/pipeline/pipelineStorage';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import { RandomizeHistory } from '../procgen/randomize/randomizeHistory';
import { TemplateLibrary } from '../procgen/templates/templateLibrary';
import { WorldSampler } from '../procgen/worldSampler';
import { PrefabLibrary } from '../prefabs/prefabLibrary';
import { debounce } from '../ui/debounce';
import { CaptureTool } from '../world/capture/captureTool';
import { isWalkableTile } from '../world/tileWalkability';
import { Tileset } from '../world/tiles/tileset';
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
  sim: CreatureSim;
  clock: CreatureClock;
  capture: CaptureTool;
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
  const sampler = new WorldSampler(store, evaluator, tileset, prefabs, items);
  const isWalkableAt = (x: number, y: number) => isWalkableTile(tileset, sampler.tileAt(x, y));
  const world = new World(isWalkableAt);
  const net = new MultiplayerSession(world, store, isWalkableAt);
  const chatComposer = new ChatComposerState();
  const sim = new CreatureSim({ sampler, library: creatures, world, isWalkableAt });
  const clock = new CreatureClock(sim);
  const renderers = new WorldRenderers();
  const worldChanged = new ChangeNotifier();
  const randomizeHistory = new RandomizeHistory();
  let playerMode: AbilityMode = 'god';

  const capture = new CaptureTool((region) =>
    perform('capture_region', {
      min_x: region.minX,
      min_y: region.minY,
      max_x: region.maxX,
      max_y: region.maxY,
    }),
  );

  function perform(action: string, params: Record<string, unknown> = {}): AbilityResult {
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
        actor: {
          pose: () => ({ x: world.playerX, y: world.playerY, facing: world.facing }),
          tryStep: (dx, dy) => world.tryStep(dx, dy),
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
    if (action.startsWith('step_') || action.startsWith('turn_') || action.startsWith('strafe_')) {
      return playerMode;
    }
    // Sight lives on the character, so its actions resolve there whichever view is open.
    return abilityFor('character', action)?.group === 'senses' ? 'character' : 'god';
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
    sim,
    clock,
    capture,
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

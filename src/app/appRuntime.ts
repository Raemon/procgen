import { CreatureLibrary } from '../creatures/creatureLibrary';
import { CreatureClock } from '../creatures/sim/creatureClock';
import { CreatureSim } from '../creatures/sim/creatureSim';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { attachPipelinePersistence, loadStoredPipeline } from '../procgen/pipeline/pipelineStorage';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import { TemplateLibrary } from '../procgen/templates/templateLibrary';
import { WorldSampler } from '../procgen/worldSampler';
import { PrefabLibrary } from '../prefabs/prefabLibrary';
import { debounce } from '../ui/debounce';
import { CaptureTool } from '../world/capture/captureTool';
import { capturePrefabFromWorld } from '../world/capture/capturePrefabFromWorld';
import { isWalkableTile } from '../world/tileWalkability';
import { Tileset } from '../world/tiles/tileset';
import { World } from '../world/world';
import { ChangeNotifier } from './changeNotifier';
import { WorldRenderers } from './worldRenderers';

const VALUE_TWEAK_DEBOUNCE_MS = 150;

export interface AppRuntime {
  tileset: Tileset;
  prefabs: PrefabLibrary;
  creatures: CreatureLibrary;
  store: PipelineStore;
  templates: TemplateLibrary;
  worldPresets: WorldPresetLibrary;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
  world: World;
  sim: CreatureSim;
  clock: CreatureClock;
  capture: CaptureTool;
  renderers: WorldRenderers;
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
  const store = new PipelineStore(loadStoredPipeline());
  attachPipelinePersistence(store);
  const evaluator = new PipelineEvaluator(store);
  const sampler = new WorldSampler(store, evaluator, tileset, prefabs);
  const isWalkableAt = (x: number, y: number) => isWalkableTile(tileset, sampler.tileAt(x, y));
  const world = new World(isWalkableAt);
  const sim = new CreatureSim({ sampler, library: creatures, world, isWalkableAt });
  const clock = new CreatureClock(sim);
  const renderers = new WorldRenderers();
  const worldChanged = new ChangeNotifier();
  const capture = new CaptureTool((region) => capturePrefabFromWorld(prefabs, sampler, region));

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
  world.on('player-moved', () => renderers.recenterAll());

  return {
    tileset,
    templates,
    worldPresets,
    prefabs,
    creatures,
    store,
    evaluator,
    sampler,
    world,
    sim,
    clock,
    capture,
    renderers,
    subscribeToWorldChange: worldChanged.subscribe,
    applyWorldChange,
    flushPendingTweaks: applyAfterTweaks.flushIfPending,
  };
}

function tileIdByName(tileset: Tileset, name: string): number {
  return tileset.all().find((tile) => tile.name === name)?.id ?? -1;
}

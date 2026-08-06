import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { attachPipelinePersistence, loadStoredPipeline } from '../procgen/pipeline/pipelineStorage';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { TemplateLibrary } from '../procgen/templates/templateLibrary';
import { WorldSampler } from '../procgen/worldSampler';
import { debounce } from '../ui/debounce';
import { isWalkableTile } from '../world/tileWalkability';
import { Tileset } from '../world/tiles/tileset';
import { World } from '../world/world';
import { ChangeNotifier } from './changeNotifier';
import { WorldRenderers } from './worldRenderers';

const VALUE_TWEAK_DEBOUNCE_MS = 150;

export interface AppRuntime {
  tileset: Tileset;
  store: PipelineStore;
  templates: TemplateLibrary;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
  world: World;
  renderers: WorldRenderers;
  subscribeToWorldChange(listener: () => void): () => void;
  applyWorldChange(): void;
  flushPendingTweaks(): void;
}

export function createAppRuntime(): AppRuntime {
  const tileset = new Tileset();
  const templates = new TemplateLibrary();
  const store = new PipelineStore(loadStoredPipeline());
  attachPipelinePersistence(store);
  const evaluator = new PipelineEvaluator(store);
  const sampler = new WorldSampler(store, evaluator, tileset);
  const world = new World((x, y) => isWalkableTile(tileset, sampler.tileAt(x, y)));
  const renderers = new WorldRenderers();
  const worldChanged = new ChangeNotifier();

  function applyWorldChange(): void {
    world.ensurePlayerOnWalkableGround();
    renderers.redrawAll();
    worldChanged.emit();
  }

  const applyAfterTweaks = debounce(applyWorldChange, VALUE_TWEAK_DEBOUNCE_MS);
  store.onChange((change) =>
    change === 'structure' ? applyWorldChange() : applyAfterTweaks.schedule(),
  );
  tileset.onChange(applyWorldChange);
  world.on('player-moved', () => renderers.recenterAll());

  return {
    tileset,
    templates,
    store,
    evaluator,
    sampler,
    world,
    renderers,
    subscribeToWorldChange: worldChanged.subscribe,
    applyWorldChange,
    flushPendingTweaks: applyAfterTweaks.flushIfPending,
  };
}

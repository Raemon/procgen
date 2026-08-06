import './styles/index.css';
import './procgen/nodes';
import { MovementInput } from './input/movementInput';
import { PipelineEvaluator } from './procgen/eval/evaluator';
import { attachPipelinePersistence, loadStoredPipeline } from './procgen/pipeline/pipelineStorage';
import { PipelineStore } from './procgen/pipeline/pipelineStore';
import { WorldSampler } from './procgen/worldSampler';
import { elementById, PANEL_START_WIDTHS, renderAppLayout } from './ui/appLayout';
import { debounce } from './ui/debounce';
import { enablePanelResizing } from './ui/panelResize';
import { rerenderOnPanelBlur } from './ui/rerenderOnPanelBlur';
import { ProcgenPanel } from './ui/procgenPanel/procgenPanel';
import { TileEditor } from './ui/tileEditor/tileEditor';
import { ViewModeToggle } from './ui/viewModeToggle';
import { AsciiView } from './views/ascii/asciiView';
import { recenterViewsWhenPlayerMoves } from './views/camera/recenterOnPlayerMove';
import { View3D } from './views/view3d/view3d';
import { isWalkableTile } from './world/tileWalkability';
import { Tileset } from './world/tiles/tileset';
import { World } from './world/world';

const VALUE_TWEAK_DEBOUNCE_MS = 150;

const app = elementById('app');
renderAppLayout(app);
enablePanelResizing(app, PANEL_START_WIDTHS);

const tileset = new Tileset();
const store = new PipelineStore(loadStoredPipeline());
attachPipelinePersistence(store);
const evaluator = new PipelineEvaluator(store);
const sampler = new WorldSampler(store, evaluator, tileset);
const world = new World((x, y) => isWalkableTile(tileset, sampler.tileAt(x, y)));

const tilePanel = elementById('tile-panel');
const procgenPanel = elementById('procgen-panel');
new TileEditor(tilePanel, tileset);
const panel = new ProcgenPanel(procgenPanel, { store, tileset, evaluator });

const asciiView = new AsciiView(elementById('slot-ascii'), world, sampler, tileset);
const view3d = new View3D(elementById('slot-3d'), world, sampler, tileset);

function applyWorldChange(): void {
  world.ensurePlayerOnWalkableGround();
  asciiView.draw();
  view3d.onWorldChanged();
  panel.refreshErrors();
}

const applyAfterTweaks = debounce(applyWorldChange, VALUE_TWEAK_DEBOUNCE_MS);

store.onChange((change) => {
  if (change === 'structure') applyWorldChange();
  else applyAfterTweaks.schedule();
});
rerenderOnPanelBlur([tilePanel, procgenPanel], () => applyAfterTweaks.flushIfPending());
tileset.onChange(() => applyWorldChange());
recenterViewsWhenPlayerMoves(world, [asciiView, view3d]);

const viewMode = new ViewModeToggle(
  { ascii: elementById('slot-ascii'), view3d: elementById('slot-3d') },
  () => asciiView.draw(),
);

new MovementInput({
  step: (dx, dy) => world.tryStep(dx, dy),
  rotate: (direction) => view3d.rotate(direction),
  yawQuadrant: () => (viewMode.current() === '3d' ? view3d.yawQuadrant() : 0),
});

applyWorldChange();

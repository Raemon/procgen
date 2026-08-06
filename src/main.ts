import './styles/index.css';
import { MovementInput } from './input/movementInput';
import { elementById, PANEL_START_WIDTHS, renderAppLayout } from './ui/appLayout';
import { GenPanel } from './ui/genPanel/genPanel';
import { enablePanelResizing } from './ui/panelResize';
import { TileEditor } from './ui/tileEditor/tileEditor';
import { ViewModeToggle } from './ui/viewModeToggle';
import { AsciiView } from './views/ascii/asciiView';
import { View3D } from './views/view3d/view3d';
import { Tileset } from './world/tiles/tileset';
import { World } from './world/world';

const app = elementById('app');
renderAppLayout(app);
enablePanelResizing(app, PANEL_START_WIDTHS);

const tileset = new Tileset();
const world = new World(tileset);

new TileEditor(elementById('tile-panel'), tileset);
const genPanel = new GenPanel(elementById('gen-panel'), (params) => world.regenerate(params));

const asciiView = new AsciiView(elementById('slot-ascii'), world, tileset);
const view3d = new View3D(elementById('slot-3d'), world, tileset);

world.on('generated', () => {
  asciiView.draw();
  view3d.onGenerated();
});
world.on('player-moved', () => asciiView.draw());
tileset.onChange(() => {
  asciiView.draw();
  view3d.onTilesetChanged();
});

const viewMode = new ViewModeToggle(
  { ascii: elementById('slot-ascii'), view3d: elementById('slot-3d') },
  () => asciiView.draw(),
);
elementById('btn-regen').addEventListener('click', () => genPanel.regenerateNow());

new MovementInput({
  step: (dx, dy) => world.tryStep(dx, dy),
  rotate: (direction) => view3d.rotate(direction),
  yawQuadrant: () => (viewMode.current() === '3d' ? view3d.yawQuadrant() : 0),
});

genPanel.regenerateNow();

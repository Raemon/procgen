// procgen — composition root. Three panels: tile editor, generation knobs,
// world view (ascii / 2.5d over one shared world state).

import './style.css';
import { AsciiView } from './asciiView';
import { GenPanel } from './genPanel';
import { MovementInput } from './input';
import { enablePanelResizing } from './panelResize';
import { TileEditor } from './tileEditor';
import { Tileset } from './tiles';
import { View3D } from './view3d';
import { World } from './world';

type ViewMode = 'ascii' | '3d';

const app = document.getElementById('app')!;
app.innerHTML = `
  <div class="panel" id="tile-panel"></div>
  <div class="panel-resizer"></div>
  <div class="panel" id="gen-panel"></div>
  <div class="panel-resizer"></div>
  <div class="world-panel">
    <div class="world-toolbar">
      <button type="button" class="btn" id="btn-ascii">ASCII</button>
      <button type="button" class="btn" id="btn-3d">2.5D</button>
      <button type="button" class="btn" id="btn-regen">↻ regenerate</button>
      <div class="spacer"></div>
      <p class="hint">WASD/arrows move · Q/E rotate camera · wheel zoom (2.5d)</p>
    </div>
    <div class="world-stage" tabindex="0">
      <div class="view-slot" id="slot-ascii"></div>
      <div class="view-slot hidden" id="slot-3d"></div>
    </div>
  </div>
`;

enablePanelResizing(app, [260, 280]);

const tileset = new Tileset();
const world = new World(tileset);

new TileEditor(document.getElementById('tile-panel')!, tileset);
const genPanel = new GenPanel(document.getElementById('gen-panel')!, (params) =>
  world.regenerate(params),
);

const slotAscii = document.getElementById('slot-ascii')!;
const slot3d = document.getElementById('slot-3d')!;
const ascii = new AsciiView(slotAscii, world, tileset);
const view3d = new View3D(slot3d, world, tileset);

world.on('generated', () => {
  ascii.draw();
  view3d.onGenerated();
});
world.on('player-moved', () => ascii.draw());
tileset.onChange(() => {
  ascii.draw();
  view3d.onTilesetChanged();
});

// ---- view toggle ------------------------------------------------------------

const btnAscii = document.getElementById('btn-ascii') as HTMLButtonElement;
const btn3d = document.getElementById('btn-3d') as HTMLButtonElement;
let mode: ViewMode = 'ascii';

function setMode(next: ViewMode): void {
  mode = next;
  slotAscii.classList.toggle('hidden', mode !== 'ascii');
  slot3d.classList.toggle('hidden', mode !== '3d');
  btnAscii.classList.toggle('active', mode === 'ascii');
  btn3d.classList.toggle('active', mode === '3d');
  if (mode === 'ascii') ascii.draw();
  // World state (grid, player, camera facing) is shared, so toggling is free.
}

btnAscii.addEventListener('click', () => setMode('ascii'));
btn3d.addEventListener('click', () => setMode('3d'));
document.getElementById('btn-regen')!.addEventListener('click', () => genPanel.regenerateNow());
setMode('ascii');

// ---- movement ---------------------------------------------------------------

new MovementInput({
  step: (dx, dy) => world.tryStep(dx, dy),
  rotate: (dir) => view3d.rotate(dir),
  // Camera-relative in 2.5d; the ascii view always looks north.
  yawQuadrant: () => (mode === '3d' ? view3d.yawQuadrant() : 0),
});

// First world.
genPanel.regenerateNow();

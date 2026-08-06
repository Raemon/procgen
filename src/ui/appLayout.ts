export const PANEL_START_WIDTHS: [number, number] = [260, 300];

export function renderAppLayout(app: HTMLElement): void {
  app.innerHTML = `
    <div class="panel" id="tile-panel"></div>
    <div class="panel-resizer"></div>
    <div class="panel" id="procgen-panel"></div>
    <div class="panel-resizer"></div>
    <div class="world-panel">
      <div class="world-toolbar">
        <button type="button" class="btn" id="btn-ascii">ASCII</button>
        <button type="button" class="btn" id="btn-3d">2.5D</button>
        <div class="spacer"></div>
        <p class="hint">WASD/arrows move · Q/E rotate camera · wheel zoom · drag to pan · double-click to recenter</p>
      </div>
      <div class="world-stage" tabindex="0">
        <div class="view-slot" id="slot-ascii"></div>
        <div class="view-slot hidden" id="slot-3d"></div>
      </div>
    </div>
  `;
}

export function elementById(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing element #${id}`);
  return element;
}

// AsciiView — the world as a monospace grid of glyphs, one char per tile,
// player as a bright @. Borrowed from chunkmaze's AsciiMapView / bot-API
// observation: this doubles as the llm-agent view, so `worldToAscii` keeps a
// clean pure-text form alongside the colored canvas rendering.

import { EMPTY } from './grid';
import type { Tileset } from './tiles';
import type { World } from './world';

/** Canvas pixels per glyph cell (CSS px). */
const CELL = 16;
const BACKGROUND = '#0a0d13';
const PLAYER_INK = '#ffd86a';
const UNKNOWN_INK = '#555555';
const DPR_CAP = 1.5;

/** The pure text form — what an agent would be handed. One char per tile,
 *  newline per row, '@' where the player stands. */
export function worldToAscii(world: World, tileset: Tileset): string {
  const lines: string[] = [];
  for (let y = 0; y < world.grid.height; y++) {
    let line = '';
    for (let x = 0; x < world.grid.width; x++) {
      if (x === world.playerX && y === world.playerY) {
        line += '@';
        continue;
      }
      const t = world.grid.get(x, y);
      line += t === EMPTY ? ' ' : (tileset.byId(t)?.symbol ?? '?');
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export class AsciiView {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;

  constructor(
    private readonly container: HTMLElement,
    private readonly world: World,
    private readonly tileset: Tileset,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'ascii-canvas';
    container.appendChild(this.canvas);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
    this.resizeObserver = new ResizeObserver(() => this.draw());
    this.resizeObserver.observe(container);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.canvas.remove();
  }

  draw(): void {
    const cssW = this.container.clientWidth;
    const cssH = this.container.clientHeight;
    if (cssW === 0 || cssH === 0) return;
    const dpr = Math.min(DPR_CAP, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;

    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, cssW, cssH);

    const grid = this.world.grid;
    const cols = Math.floor(cssW / CELL);
    const rows = Math.floor(cssH / CELL);

    // Viewport centered on the player when the grid outgrows the panel,
    // clamped so the edge of the world sits at the edge of the panel.
    const originX = clampOrigin(this.world.playerX, cols, grid.width);
    const originY = clampOrigin(this.world.playerY, rows, grid.height);
    // A grid smaller than the panel is centered instead.
    const padX = Math.max(0, Math.floor((cols - grid.width) / 2)) * CELL;
    const padY = Math.max(0, Math.floor((rows - grid.height) / 2)) * CELL;

    ctx.font = `${CELL - 2}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x1 = Math.min(grid.width, originX + cols);
    const y1 = Math.min(grid.height, originY + rows);
    for (let y = originY; y < y1; y++) {
      for (let x = originX; x < x1; x++) {
        const sx = padX + (x - originX) * CELL + CELL / 2;
        const sy = padY + (y - originY) * CELL + CELL / 2;
        if (x === this.world.playerX && y === this.world.playerY) {
          ctx.fillStyle = PLAYER_INK;
          ctx.fillText('@', sx, sy);
          continue;
        }
        const t = grid.get(x, y);
        if (t === EMPTY) continue;
        const def = this.tileset.byId(t);
        ctx.fillStyle = def?.color ?? UNKNOWN_INK;
        ctx.fillText(def?.symbol ?? '?', sx, sy);
      }
    }
  }
}

/** Top-left world column/row for a viewport of `span` cells following `focus`. */
function clampOrigin(focus: number, span: number, worldSize: number): number {
  if (worldSize <= span) return 0;
  return Math.max(0, Math.min(worldSize - span, focus - Math.floor(span / 2)));
}

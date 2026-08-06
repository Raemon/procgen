import { EMPTY } from '../../world/grid';
import type { Tileset } from '../../world/tiles/tileset';
import type { World } from '../../world/world';
import {
  containerSize,
  isCollapsed,
  sizeCanvasToContainer,
  type CanvasSize,
} from '../canvasSurface';
import { viewportFollowingPlayer, type AsciiViewport } from './asciiViewport';
import { PLAYER_GLYPH, UNKNOWN_GLYPH } from './worldToAscii';

const CELL_PX = 16;
const BACKGROUND_INK = '#0a0d13';
const PLAYER_INK = '#ffd86a';
const UNKNOWN_INK = '#555555';
const GLYPH_FONT = `${CELL_PX - 2}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

export class AsciiView {
  readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly resizeObserver = new ResizeObserver(() => this.draw());

  constructor(
    private readonly container: HTMLElement,
    private readonly world: World,
    private readonly tileset: Tileset,
  ) {
    this.canvas.className = 'ascii-canvas';
    container.appendChild(this.canvas);
    this.ctx = get2dContext(this.canvas);
    this.resizeObserver.observe(container);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.canvas.remove();
  }

  draw(): void {
    const size = containerSize(this.container);
    if (isCollapsed(size)) return;
    this.startFrame(size);
    this.drawGlyphs(size);
  }

  private startFrame(size: CanvasSize): void {
    const ratio = sizeCanvasToContainer(this.canvas, size);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ctx.fillStyle = BACKGROUND_INK;
    this.ctx.fillRect(0, 0, size.cssWidth, size.cssHeight);
    this.ctx.font = GLYPH_FONT;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  private drawGlyphs(size: CanvasSize): void {
    const viewport = viewportFollowingPlayer(
      this.world.grid,
      this.world.playerX,
      this.world.playerY,
      Math.floor(size.cssWidth / CELL_PX),
      Math.floor(size.cssHeight / CELL_PX),
    );
    for (let y = viewport.originY; y < viewport.lastY; y++) {
      for (let x = viewport.originX; x < viewport.lastX; x++) {
        this.drawCell(viewport, x, y);
      }
    }
  }

  private drawCell(viewport: AsciiViewport, x: number, y: number): void {
    const screenX = cellCenterPx(viewport.padCellsX, x - viewport.originX);
    const screenY = cellCenterPx(viewport.padCellsY, y - viewport.originY);
    if (x === this.world.playerX && y === this.world.playerY) {
      this.paint(PLAYER_GLYPH, PLAYER_INK, screenX, screenY);
      return;
    }
    const tileId = this.world.grid.get(x, y);
    if (tileId === EMPTY) return;
    const tile = this.tileset.byId(tileId);
    this.paint(tile?.symbol ?? UNKNOWN_GLYPH, tile?.color ?? UNKNOWN_INK, screenX, screenY);
  }

  private paint(glyph: string, ink: string, x: number, y: number): void {
    this.ctx.fillStyle = ink;
    this.ctx.fillText(glyph, x, y);
  }
}

function cellCenterPx(padCells: number, cellsFromOrigin: number): number {
  return (padCells + cellsFromOrigin) * CELL_PX + CELL_PX / 2;
}

function get2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  return ctx;
}

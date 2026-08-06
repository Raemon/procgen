import type { WorldSampler } from '../../procgen/worldSampler';
import type { Tileset } from '../../world/tiles/tileset';
import type { World } from '../../world/world';
import {
  containerSize,
  isCollapsed,
  sizeCanvasToContainer,
  type CanvasSize,
} from '../canvasSurface';
import { asciiCellAt, markerLookup } from './asciiCells';
import { viewportCenteredOn, type AsciiViewport } from './asciiViewport';

const CELL_PX = 16;
const BACKGROUND_INK = '#0a0d13';
const GLYPH_FONT = `${CELL_PX - 2}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

export class AsciiView {
  readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly resizeObserver = new ResizeObserver(() => this.draw());

  constructor(
    private readonly container: HTMLElement,
    private readonly world: World,
    private readonly sampler: WorldSampler,
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
    const viewport = viewportCenteredOn(
      this.world.playerX,
      this.world.playerY,
      Math.floor(size.cssWidth / CELL_PX),
      Math.floor(size.cssHeight / CELL_PX),
    );
    const markers = markerLookup(this.sampler, viewport);
    for (let row = 0; row < viewport.rows; row++) {
      for (let column = 0; column < viewport.columns; column++) {
        this.drawCell(viewport, markers, column, row);
      }
    }
  }

  private drawCell(
    viewport: AsciiViewport,
    markers: ReturnType<typeof markerLookup>,
    column: number,
    row: number,
  ): void {
    const x = viewport.originX + column;
    const y = viewport.originY + row;
    const isPlayerHere = x === this.world.playerX && y === this.world.playerY;
    const cell = asciiCellAt(this.sampler, this.tileset, markers, x, y, isPlayerHere);
    if (cell) this.paint(cell.glyph, cell.ink, cellCenterPx(column), cellCenterPx(row));
  }

  private paint(glyph: string, ink: string, x: number, y: number): void {
    this.ctx.fillStyle = ink;
    this.ctx.fillText(glyph, x, y);
  }
}

function cellCenterPx(cellsFromOrigin: number): number {
  return cellsFromOrigin * CELL_PX + CELL_PX / 2;
}

function get2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  return ctx;
}

import type { WorldSampler } from '../../procgen/worldSampler';
import type { Tileset } from '../../world/tiles/tileset';
import type { World } from '../../world/world';
import { listenForDragPan } from '../camera/dragPanListener';
import { listenForWheelZoom } from '../camera/wheelZoomListener';
import {
  containerSize,
  isCollapsed,
  sizeCanvasToContainer,
  type CanvasSize,
} from '../canvasSurface';
import { AsciiCamera } from './asciiCamera';
import { GLYPH_LEGIBLE_CELL_PX } from './asciiCellPixels';
import { asciiCellAt, markerLookup } from './asciiCells';
import { viewportCoveringCanvas, type AsciiPixelViewport } from './asciiViewport';

const BACKGROUND_INK = '#0a0d13';
const GLYPH_FONT_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const BLOCK_FILL_FRACTION = 0.85;

export class AsciiView {
  readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly camera = new AsciiCamera();
  private readonly resizeObserver = new ResizeObserver(() => this.draw());
  private lastCursor = { x: 0, y: 0 };

  constructor(
    private readonly container: HTMLElement,
    private readonly world: World,
    private readonly sampler: WorldSampler,
    private readonly tileset: Tileset,
  ) {
    this.canvas.className = 'ascii-canvas pannable';
    container.appendChild(this.canvas);
    this.ctx = get2dContext(this.canvas);
    this.listenForCameraGestures();
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

  private listenForCameraGestures(): void {
    listenForWheelZoom(this.canvas, (wheelPixelsY) => {
      const size = containerSize(this.container);
      if (isCollapsed(size)) return;
      if (this.camera.zoomAtCursor(wheelPixelsY, this.lastCursor, size)) this.draw();
    });
    this.canvas.addEventListener('pointermove', (event) => {
      this.lastCursor = { x: event.offsetX, y: event.offsetY };
    });
    listenForDragPan(this.canvas, (dxPixels, dyPixels) => {
      this.camera.dragByPixels(dxPixels, dyPixels, containerSize(this.container));
      this.draw();
    });
    this.canvas.addEventListener('dblclick', () => {
      if (this.camera.recenter()) this.draw();
    });
  }

  private startFrame(size: CanvasSize): void {
    const ratio = sizeCanvasToContainer(this.canvas, size);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ctx.fillStyle = BACKGROUND_INK;
    this.ctx.fillRect(0, 0, size.cssWidth, size.cssHeight);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  private drawGlyphs(size: CanvasSize): void {
    const viewport = viewportCoveringCanvas(
      this.camera.centerX(this.world.playerX),
      this.camera.centerY(this.world.playerY),
      this.camera.cellPixels(size),
      size,
    );
    this.ctx.font = `${Math.max(1, Math.round(viewport.cellPx - 2))}px ${GLYPH_FONT_STACK}`;
    const markers = markerLookup(this.sampler, viewport);
    const drawAsBlocks = viewport.cellPx < GLYPH_LEGIBLE_CELL_PX;
    for (let row = 0; row < viewport.rows; row++) {
      for (let column = 0; column < viewport.columns; column++) {
        this.drawCell(viewport, markers, column, row, drawAsBlocks);
      }
    }
  }

  private drawCell(
    viewport: AsciiPixelViewport,
    markers: ReturnType<typeof markerLookup>,
    column: number,
    row: number,
    drawAsBlocks: boolean,
  ): void {
    const x = viewport.originX + column;
    const y = viewport.originY + row;
    const isPlayerHere = x === this.world.playerX && y === this.world.playerY;
    const cell = asciiCellAt(this.sampler, this.tileset, markers, x, y, isPlayerHere);
    if (!cell) return;
    const centerX = cellCenterPx(column, viewport.cellPx, viewport.subCellOffsetX);
    const centerY = cellCenterPx(row, viewport.cellPx, viewport.subCellOffsetY);
    this.ctx.fillStyle = cell.ink;
    if (drawAsBlocks) this.paintBlock(centerX, centerY, viewport.cellPx);
    else this.ctx.fillText(cell.glyph, centerX, centerY);
  }

  private paintBlock(centerX: number, centerY: number, cellPx: number): void {
    const side = cellPx * BLOCK_FILL_FRACTION;
    this.ctx.fillRect(centerX - side / 2, centerY - side / 2, side, side);
  }
}

function cellCenterPx(cellsFromOrigin: number, cellPx: number, subCellOffset: number): number {
  return subCellOffset + cellsFromOrigin * cellPx + cellPx / 2;
}

function get2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  return ctx;
}

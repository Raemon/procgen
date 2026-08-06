import { listenForCaptureDrag } from '../../world/capture/listenForCaptureDrag';
import type { CaptureCell } from '../../world/capture/captureTool';
import { listenForDragPan } from '../camera/dragPanListener';
import { listenForWheelZoom } from '../camera/wheelZoomListener';
import {
  containerSize,
  isCollapsed,
  sizeCanvasToContainer,
  type CanvasSize,
} from '../canvasSurface';
import type { WorldViewDeps } from '../worldViewDeps';
import { WORLD_CANVAS_CLASSES } from '../worldCanvasClasses';
import { AsciiCamera } from './asciiCamera';
import { GLYPH_LEGIBLE_CELL_PX } from './asciiCellPixels';
import { asciiCellAt, creatureLookup, markerLookup, type AsciiOverlays } from './asciiCells';
import { paintSelectionOverlay } from './asciiSelectionOverlay';
import { viewportCoveringCanvas, type AsciiPixelViewport } from './asciiViewport';

const BACKGROUND_INK = '#0a0d13';
const GLYPH_FONT_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const BLOCK_FILL_FRACTION = 0.85;

export class AsciiView {
  readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly camera = new AsciiCamera();
  private readonly resizeObserver = new ResizeObserver(() => this.draw());

  constructor(
    private readonly container: HTMLElement,
    private readonly deps: WorldViewDeps,
  ) {
    this.canvas.className = WORLD_CANVAS_CLASSES;
    container.appendChild(this.canvas);
    this.ctx = get2dContext(this.canvas);
    this.listenForCameraGestures();
    listenForCaptureDrag(this.canvas, deps.capture, (x, y) => this.cellAtPixel(x, y));
    this.resizeObserver.observe(container);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.canvas.remove();
  }

  recenterOnPlayer(): void {
    this.camera.recenter();
    this.draw();
  }

  draw(): void {
    const size = containerSize(this.container);
    if (isCollapsed(size)) return;
    this.startFrame(size);
    const viewport = this.viewportFor(size);
    this.drawGlyphs(viewport);
    this.drawSelection(viewport);
  }

  private cellAtPixel(offsetX: number, offsetY: number): CaptureCell | null {
    const size = containerSize(this.container);
    if (isCollapsed(size)) return null;
    const viewport = this.viewportFor(size);
    return {
      x: viewport.originX + Math.floor((offsetX - viewport.subCellOffsetX) / viewport.cellPx),
      y: viewport.originY + Math.floor((offsetY - viewport.subCellOffsetY) / viewport.cellPx),
    };
  }

  private viewportFor(size: CanvasSize): AsciiPixelViewport {
    return viewportCoveringCanvas(
      this.camera.centerX(this.deps.world.playerX),
      this.camera.centerY(this.deps.world.playerY),
      this.camera.cellPixels(size),
      size,
    );
  }

  private listenForCameraGestures(): void {
    listenForWheelZoom(this.canvas, (wheelPixelsY, cursor) => {
      const size = containerSize(this.container);
      if (isCollapsed(size)) return;
      if (this.camera.zoomAtCursor(wheelPixelsY, cursor, size)) this.draw();
    });
    listenForDragPan(
      this.canvas,
      (dxPixels, dyPixels) => {
        this.camera.dragByPixels(dxPixels, dyPixels, containerSize(this.container));
        this.draw();
      },
      () => !this.deps.capture.isActive(),
    );
    this.canvas.addEventListener('dblclick', () => this.recenterOnPlayer());
  }

  private startFrame(size: CanvasSize): void {
    const ratio = sizeCanvasToContainer(this.canvas, size);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ctx.fillStyle = BACKGROUND_INK;
    this.ctx.fillRect(0, 0, size.cssWidth, size.cssHeight);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  private drawGlyphs(viewport: AsciiPixelViewport): void {
    this.ctx.font = `${Math.max(1, Math.round(viewport.cellPx - 2))}px ${GLYPH_FONT_STACK}`;
    const overlays: AsciiOverlays = {
      markers: markerLookup(this.deps.sampler, viewport),
      creatures: creatureLookup(this.deps.sim, this.deps.creatures),
    };
    const drawAsBlocks = viewport.cellPx < GLYPH_LEGIBLE_CELL_PX;
    for (let row = 0; row < viewport.rows; row++) {
      for (let column = 0; column < viewport.columns; column++) {
        this.drawCell(viewport, overlays, column, row, drawAsBlocks);
      }
    }
  }

  private drawSelection(viewport: AsciiPixelViewport): void {
    const region = this.deps.capture.selectedRegion();
    if (region) paintSelectionOverlay(this.ctx, viewport, region);
  }

  private drawCell(
    viewport: AsciiPixelViewport,
    overlays: AsciiOverlays,
    column: number,
    row: number,
    drawAsBlocks: boolean,
  ): void {
    const x = viewport.originX + column;
    const y = viewport.originY + row;
    const isPlayerHere = x === this.deps.world.playerX && y === this.deps.world.playerY;
    const cell = asciiCellAt(this.deps.sampler, this.deps.tileset, overlays, x, y, isPlayerHere);
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

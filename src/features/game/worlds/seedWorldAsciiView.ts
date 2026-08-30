import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { asciiColorOn } from '../render/agentText/asciiColorPreference';
import { asciiGlyphPaint, WALKABLE_GLYPH_OPACITY } from '../render/agentText/asciiGlyphPaint';
import { asciiCellAt, EMPTY_GLYPH, pointOverlayLookup } from '../render/ascii/asciiCells';
import { viewportCenteredOn } from '../render/ascii/asciiViewport';
import { containerSize, isCollapsed, sizeCanvasToContainer } from '../render/canvasSurface';
import { NIGHT_INK } from '../render/view3d/skyInk';
import type { SeedWorld } from './seedWorld';

const GLYPH_PX_AT_UNIT_ZOOM = 8;
const MIN_GLYPH_PX = 4;
const MIN_VIEW_SIDE = 5;

export class SeedWorldAsciiView {
  private readonly canvas = document.createElement('canvas');
  private readonly resizeObserver: ResizeObserver;

  constructor(
    private readonly container: HTMLElement,
    private world: SeedWorld,
    private readonly tileAssets: ReadOnlyTileAssets,
    private zoom: number,
  ) {
    this.canvas.className = 'block h-full w-full';
    container.appendChild(this.canvas);
    this.resizeObserver = new ResizeObserver(() => this.draw());
    this.resizeObserver.observe(container);
    this.draw();
  }

  setWorld(world: SeedWorld): void {
    this.world = world;
    this.draw();
  }

  setZoom(zoom: number): void {
    this.zoom = zoom;
    this.draw();
  }

  draw(): void {
    const size = containerSize(this.container);
    if (isCollapsed(size)) return;
    sizeCanvasToContainer(this.canvas, size);
    const context = this.canvas.getContext('2d');
    if (!context) return;
    const cellPx = Math.max(MIN_GLYPH_PX, GLYPH_PX_AT_UNIT_ZOOM * this.zoom);
    const columns = oddAtLeast(Math.floor(size.cssWidth / cellPx), MIN_VIEW_SIDE);
    const rows = oddAtLeast(Math.floor(size.cssHeight / cellPx), MIN_VIEW_SIDE);
    const viewport = viewportCenteredOn(this.world.spawnX, this.world.spawnY, columns, rows);
    const markers = pointOverlayLookup(this.world.sampler, viewport);
    const colorOn = asciiColorOn();
    context.setTransform(this.canvas.width / size.cssWidth, 0, 0, this.canvas.height / size.cssHeight, 0, 0);
    context.imageSmoothingEnabled = false;
    context.fillStyle = NIGHT_INK;
    context.fillRect(0, 0, size.cssWidth, size.cssHeight);
    context.font = `${cellPx}px ui-monospace, monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = viewport.originX + column;
        const y = viewport.originY + row;
        const isPlayerHere = x === this.world.spawnX && y === this.world.spawnY;
        const cell = asciiCellAt(
          this.world.sampler,
          this.tileAssets,
          markers,
          x,
          y,
          isPlayerHere,
        );
        if (!cell || cell.glyph === EMPTY_GLYPH) continue;
        const walkable = isPlayerHere || markers.has(`${x},${y}`)
          ? null
          : (this.tileAssets.byId(this.world.sampler.tileAt(x, y))?.walkable ?? null);
        const paint = colorOn ? asciiGlyphPaint(cell.ink, walkable) : { color: '#ffffff', opacity: 1 };
        context.globalAlpha = paint.opacity === WALKABLE_GLYPH_OPACITY ? WALKABLE_GLYPH_OPACITY : paint.opacity;
        context.fillStyle = paint.color;
        context.fillText(cell.glyph, (column + 0.5) * cellPx, (row + 0.5) * cellPx);
      }
    }
    context.globalAlpha = 1;
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.canvas.remove();
  }
}

function oddAtLeast(value: number, min: number): number {
  const clamped = Math.max(min, value);
  return clamped % 2 === 1 ? clamped : clamped + 1;
}

import type { Marker, WorldSampler } from '../../../procgen/worldSampler';
import type { CellPoint } from '../../../world/nearestWalkable';
import type { TileAssets } from '../../../assets/tiles/tileAssets';
import { asciiCellAt, pointOverlayLookup, type AsciiCell } from '../../../world/render/ascii/asciiCells';
import { viewportCenteredOn, type AsciiViewport } from '../../../world/render/ascii/asciiViewport';

const THUMB_COLUMNS = 110;
const THUMB_ROWS = 56;

export function thumbnailHtml(
  sampler: WorldSampler,
  tileAssets: TileAssets,
  center: CellPoint,
): string {
  const viewport = viewportCenteredOn(center.x, center.y, THUMB_COLUMNS, THUMB_ROWS);
  const markers = pointOverlayLookup(sampler, viewport);
  const rows: string[] = [];
  for (let row = 0; row < viewport.rows; row++) {
    rows.push(thumbnailRow(sampler, tileAssets, markers, viewport, center, row));
  }
  return rows.join('\n');
}

function thumbnailRow(
  sampler: WorldSampler,
  tileAssets: TileAssets,
  markers: Map<string, Marker>,
  viewport: AsciiViewport,
  center: CellPoint,
  row: number,
): string {
  const spans: string[] = [];
  let run = { ink: '', text: '' };
  for (let column = 0; column < viewport.columns; column++) {
    const x = viewport.originX + column;
    const y = viewport.originY + row;
    const cell = asciiCellAt(sampler, tileAssets, markers, x, y, x === center.x && y === center.y);
    run = extendRun(spans, run, cell);
  }
  flushRun(spans, run);
  return spans.join('');
}

function extendRun(
  spans: string[],
  run: { ink: string; text: string },
  cell: AsciiCell | null,
): { ink: string; text: string } {
  const ink = cell?.ink ?? run.ink;
  const glyph = escapeGlyph(cell?.glyph ?? ' ');
  if (ink === run.ink) return { ink, text: run.text + glyph };
  flushRun(spans, run);
  return { ink, text: glyph };
}

function flushRun(spans: string[], run: { ink: string; text: string }): void {
  if (run.text.length === 0) return;
  spans.push(`<span style="color:${run.ink}">${run.text}</span>`);
}

function escapeGlyph(glyph: string): string {
  return glyph.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

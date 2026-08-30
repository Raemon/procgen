import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { Slider } from '@/features/app-shell/controls/Slider';
import { classes } from '@/features/app-shell/controls/classes';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import {
  DEFAULT_WORLDS_ZOOM,
  MAX_WORLD_GRID_SIDE,
  MAX_WORLDS_ZOOM,
  MIN_WORLD_GRID_SIDE,
  MIN_WORLDS_ZOOM,
  clampedGridSide,
  clampedWorldsZoom,
} from './seedFamily';
import { WORLDS_GRID_SIZE_TIP, WORLDS_ZOOM_TIP } from './help/worldsTips';

const COMPACT_FIELD = classes(FIELD_CLASSES, 'h-5 w-7 px-0.5 py-0 text-center text-[11px]');

export function WorldsGridParams({
  columns,
  rows,
  zoom,
  onColumns,
  onRows,
  onZoom,
}: {
  columns: number;
  rows: number;
  zoom: number;
  onColumns(value: number): void;
  onRows(value: number): void;
  onZoom(value: number): void;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex items-center gap-0.5" {...tooltipHandlers(WORLDS_GRID_SIZE_TIP)}>
        <input
          type="number"
          min={MIN_WORLD_GRID_SIDE}
          max={MAX_WORLD_GRID_SIDE}
          className={COMPACT_FIELD}
          value={columns}
          aria-label="world columns"
          onChange={(event) => onColumns(clampedGridSide(Number(event.target.value)))}
        />
        <span className="text-[11px] text-ink-dim">×</span>
        <input
          type="number"
          min={MIN_WORLD_GRID_SIDE}
          max={MAX_WORLD_GRID_SIDE}
          className={COMPACT_FIELD}
          value={rows}
          aria-label="world rows"
          onChange={(event) => onRows(clampedGridSide(Number(event.target.value)))}
        />
      </span>
      <span className="flex items-center gap-1" {...tooltipHandlers(WORLDS_ZOOM_TIP)}>
        <span className="text-[11px] text-ink-dim">zoom</span>
        <span className="w-16">
          <Slider
            min={MIN_WORLDS_ZOOM}
            max={MAX_WORLDS_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(value) => onZoom(clampedWorldsZoom(value))}
          />
        </span>
        <button
          type="button"
          className="w-7 cursor-pointer text-left text-[11px] tabular-nums text-ink-dim hover:text-ink"
          aria-label={WORLDS_ZOOM_TIP.title}
          onClick={() => onZoom(DEFAULT_WORLDS_ZOOM)}
        >
          {formatZoom(zoom)}
        </button>
      </span>
    </span>
  );
}

function formatZoom(zoom: number): string {
  return Number.isInteger(zoom) ? String(zoom) : zoom.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

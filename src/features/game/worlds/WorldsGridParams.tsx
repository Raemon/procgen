import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { GridSideStepper } from './GridSideStepper';
import { WorldsZoomControl } from './WorldsZoomControl';
import { WORLDS_COLUMNS_TIP, WORLDS_GRID_SIZE_TIP, WORLDS_ROWS_TIP } from './help/worldsTips';

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
      <span className="flex items-center gap-1" {...tooltipHandlers(WORLDS_GRID_SIZE_TIP)}>
        <span className="text-[11px] text-ink-dim">grid</span>
        <GridSideStepper
          label="world columns"
          value={columns}
          tip={WORLDS_COLUMNS_TIP}
          onChange={onColumns}
        />
        <span className="text-[11px] text-ink-dim">×</span>
        <GridSideStepper
          label="world rows"
          value={rows}
          tip={WORLDS_ROWS_TIP}
          onChange={onRows}
        />
      </span>
      <span className="flex items-center gap-1">
        <span className="text-[11px] text-ink-dim">zoom</span>
        <WorldsZoomControl zoom={zoom} onZoom={onZoom} />
      </span>
    </span>
  );
}

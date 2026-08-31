import { PANEL_TIPS } from '@/features/app-shell/help/panelTips';
import { WorldsIcon } from '@/features/app-shell/icons/panelIcons';
import { PanelColumn } from '@/features/app-shell/layout/PanelColumn';
import type { PanelLayout } from '@/features/app-shell/layout/usePanelLayout';
import { isNumber } from '@/features/app-shell/state/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiValue } from '@/features/app-shell/state/usePersistedUiValue';
import { WorldsCameraToggle } from './WorldsCameraToggle';
import { WorldsGrid } from './WorldsGrid';
import { WorldsGridParams } from './WorldsGridParams';
import { WorldsRail } from './WorldsRail';
import {
  DEFAULT_WORLD_VIEW_COLUMNS,
  DEFAULT_WORLD_ROWS,
  DEFAULT_WORLDS_ZOOM,
  clampedGridSide,
  clampedWorldsZoom,
} from './seedFamily';
import { isWorldsCamera, type WorldsCamera } from './worldsCamera';

export function WorldsPanel({ layout }: { layout: PanelLayout }) {
  const [columns, setColumns] = usePersistedUiValue(
    PERSISTED_UI_KEYS.worldsColumns,
    DEFAULT_WORLD_VIEW_COLUMNS,
    isNumber,
  );
  const [rows, setRows] = usePersistedUiValue(
    PERSISTED_UI_KEYS.worldsRows,
    DEFAULT_WORLD_ROWS,
    isNumber,
  );
  const [zoom, setZoom] = usePersistedUiValue(
    PERSISTED_UI_KEYS.worldsZoom,
    DEFAULT_WORLDS_ZOOM,
    isNumber,
  );
  const [camera, setCamera] = usePersistedUiValue<WorldsCamera>(
    PERSISTED_UI_KEYS.worldsCamera,
    '3d-god',
    isWorldsCamera,
  );
  const gridColumns = clampedGridSide(columns);
  const gridRows = clampedGridSide(rows);
  const gridZoom = clampedWorldsZoom(zoom);
  return (
    <PanelColumn
      panelKey="worlds"
      title="worlds"
      tip={PANEL_TIPS.worlds}
      icon={<WorldsIcon />}
      tone="bg-panel"
      rail={<WorldsRail />}
      fill
      headerActions={
        <span className="flex items-center gap-1.5">
          <WorldsCameraToggle camera={camera} onChoose={setCamera} />
          <WorldsGridParams
            columns={gridColumns}
            rows={gridRows}
            zoom={gridZoom}
            onColumns={setColumns}
            onRows={setRows}
            onZoom={setZoom}
          />
        </span>
      }
      layout={layout}
    >
      <WorldsGrid columns={gridColumns} rows={gridRows} zoom={gridZoom} camera={camera} />
    </PanelColumn>
  );
}

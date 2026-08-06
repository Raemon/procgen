import { ProcgenPanel } from '../panels/procgen/ProcgenPanel';
import { TileEditorPanel } from '../panels/tiles/TileEditorPanel';
import { WorldPanel } from '../panels/world/WorldPanel';
import { FloatingTooltip } from '../ui/tooltips/FloatingTooltip';
import { Panel } from './Panel';
import { PanelResizer } from './PanelResizer';
import { usePanelWidths } from './usePanelWidths';

export function App() {
  const { widths, gridTemplateColumns, resizePanel } = usePanelWidths();
  return (
    <>
      <div className="grid h-full" style={{ gridTemplateColumns }}>
        <Panel className="bg-panel">
          <TileEditorPanel />
        </Panel>
        <PanelResizer width={widths[0]!} onResize={(width) => resizePanel(0, width)} />
        <Panel className="bg-procgen">
          <ProcgenPanel />
        </Panel>
        <PanelResizer width={widths[1]!} onResize={(width) => resizePanel(1, width)} />
        <WorldPanel />
      </div>
      <FloatingTooltip />
    </>
  );
}

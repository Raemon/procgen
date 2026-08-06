import { ProcgenPanel } from '../ui/procgenPanel/ProcgenPanel';
import { LibraryPanel } from '../ui/libraryPanel/LibraryPanel';
import { FloatingTooltip } from '../ui/tooltips/FloatingTooltip';
import { WorldPanel } from '../ui/worldView/WorldPanel';
import { Panel } from './Panel';
import { PanelResizer } from './PanelResizer';
import { usePanelWidths } from './usePanelWidths';

export function App() {
  const { widths, gridTemplateColumns, resizePanel } = usePanelWidths();
  return (
    <>
      <div className="grid h-full" style={{ gridTemplateColumns }}>
        <Panel className="bg-panel">
          <LibraryPanel />
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

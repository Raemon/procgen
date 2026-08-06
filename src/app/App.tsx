import { useState } from 'react';
import { AgentLogPanel } from '../agent/ui/AgentLogPanel';
import { AgentsPanel } from '../agent/ui/AgentsPanel';
import { ProcgenPanel } from '../ui/procgenPanel/ProcgenPanel';
import { LibraryPanel } from '../ui/libraryPanel/LibraryPanel';
import { FloatingTooltip } from '../ui/tooltips/FloatingTooltip';
import { WorldPanel } from '../ui/worldView/WorldPanel';
import { Panel } from './Panel';
import { PanelResizer } from './PanelResizer';
import { usePanelWidths } from './usePanelWidths';

export function App() {
  const { widths, gridTemplateColumns, resizePanel } = usePanelWidths();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
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
        <Panel className="bg-panel">
          <AgentsPanel selectedId={selectedAgentId} onSelect={setSelectedAgentId} />
        </Panel>
        <PanelResizer width={widths[2]!} onResize={(width) => resizePanel(2, width)} />
        <Panel className="bg-procgen">
          <AgentLogPanel selectedId={selectedAgentId} />
        </Panel>
        <PanelResizer width={widths[3]!} onResize={(width) => resizePanel(3, width)} />
        <WorldPanel />
      </div>
      <FloatingTooltip />
    </>
  );
}

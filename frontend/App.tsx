import { Fragment, useState, type ReactNode } from 'react';
import { AgentLogPanel } from '../agents/panel/AgentLogPanel';
import { AgentLogRail } from '../agents/panel/AgentLogRail';
import { AgentsPanel } from '../agents/panel/AgentsPanel';
import { AgentsRail } from '../agents/panel/AgentsRail';
import { ProcgenPanel } from '../procgen/panel/ProcgenPanel';
import { ProcgenRail } from '../procgen/panel/ProcgenRail';
import { LibraryPanel } from '../library/panel/LibraryPanel';
import { LibraryRail } from '../library/panel/LibraryRail';
import {
  AgentLogIcon,
  AgentsIcon,
  LibraryIcon,
  ProcgenIcon,
} from './icons/panelIcons';
import type { TooltipContent } from './tooltips/tooltipContent';
import { FloatingTooltip } from './tooltips/FloatingTooltip';
import { WorldPanel } from '../world/panel/WorldPanel';
import { PANEL_TIPS } from './help/panelTips';
import { Panel } from './Panel';
import { PanelResizer } from './PanelResizer';
import { usePanelLayout, type PanelKey } from './usePanelLayout';

interface Column {
  key: PanelKey;
  title: string;
  tip: TooltipContent;
  icon: ReactNode;
  tone: string;
  body: ReactNode;
  rail: ReactNode;
}

export function App() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const columns = visibleColumns(selectedAgentId, setSelectedAgentId);
  const layout = usePanelLayout(columns.map((column) => column.key));
  return (
    <>
      <div className="grid h-full" style={{ gridTemplateColumns: layout.gridTemplateColumns }}>
        {columns.map((column) => (
          <Fragment key={column.key}>
            <Panel
              chrome={{
                title: column.title,
                tip: column.tip,
                icon: column.icon,
                tone: column.tone,
                rail: column.rail,
                collapsed: layout.isCollapsed(column.key),
                onToggleCollapsed: () => layout.toggleCollapsed(column.key),
              }}
            >
              {column.body}
            </Panel>
            <PanelResizer
              width={layout.widthOf(column.key)}
              disabled={layout.isCollapsed(column.key)}
              onResize={(width) => layout.resizePanel(column.key, width)}
              onResetWidth={() => layout.resetPanelWidth(column.key)}
            />
          </Fragment>
        ))}
        <WorldPanel />
      </div>
      <FloatingTooltip />
    </>
  );
}

function visibleColumns(
  selectedAgentId: string | null,
  onSelectAgent: (id: string | null) => void,
): Column[] {
  const columns: Column[] = [
    {
      key: 'library',
      tip: PANEL_TIPS.library,
      title: 'library',
      icon: <LibraryIcon />,
      tone: 'bg-panel',
      body: <LibraryPanel />,
      rail: <LibraryRail />,
    },
    {
      key: 'procgen',
      tip: PANEL_TIPS.procgen,
      title: 'procgen',
      icon: <ProcgenIcon />,
      tone: 'bg-procgen',
      body: <ProcgenPanel />,
      rail: <ProcgenRail />,
    },
    {
      key: 'agents',
      tip: PANEL_TIPS.agents,
      title: 'agents',
      icon: <AgentsIcon />,
      tone: 'bg-panel',
      body: <AgentsPanel selectedId={selectedAgentId} onSelect={onSelectAgent} />,
      rail: <AgentsRail />,
    },
  ];
  // The log has nothing to show without a selection, so it only claims a column once one exists.
  if (selectedAgentId !== null) {
    columns.push({
      key: 'log',
      tip: PANEL_TIPS.log,
      title: 'agent log',
      icon: <AgentLogIcon />,
      tone: 'bg-procgen',
      body: <AgentLogPanel selectedId={selectedAgentId} />,
      rail: <AgentLogRail selectedId={selectedAgentId} />,
    });
  }
  return columns;
}

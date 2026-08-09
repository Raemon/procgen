import { Fragment, useState, type ReactNode } from 'react';
import { AgentLogPanel } from '../agents/panel/AgentLogPanel';
import { AgentLogRail } from '../agents/panel/AgentLogRail';
import { AgentsPanel } from '../agents/panel/AgentsPanel';
import { AgentsRail } from '../agents/panel/AgentsRail';
import { DetailPanel } from '../library/detail/DetailPanel';
import { DetailRail } from '../library/panel/DetailRail';
import { LibraryPanel } from '../library/panel/LibraryPanel';
import { LibraryRail } from '../library/panel/LibraryRail';
import {
  AgentLogIcon,
  AgentsIcon,
  DetailIcon,
  LibraryIcon,
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

function anAgentIsSelectedToLog(selectedAgentId: string | null): selectedAgentId is string {
  return selectedAgentId !== null;
}

function visibleColumns(
  selectedAgentId: string | null,
  onSelectAgent: (id: string | null) => void,
): Column[] {
  const columns: Column[] = [
    {
      key: 'library',
      tip: PANEL_TIPS.library,
      title: 'asset library',
      icon: <LibraryIcon />,
      tone: 'bg-panel',
      body: <LibraryPanel />,
      rail: <LibraryRail />,
    },
    {
      key: 'detail',
      tip: PANEL_TIPS.detail,
      title: 'detail',
      icon: <DetailIcon />,
      tone: 'bg-procgen',
      body: <DetailPanel />,
      rail: <DetailRail />,
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
  if (anAgentIsSelectedToLog(selectedAgentId)) {
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

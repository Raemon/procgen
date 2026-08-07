import { Fragment, useState, type ReactNode } from 'react';
import { AgentLogPanel } from '../agent/ui/AgentLogPanel';
import { AgentsPanel } from '../agent/ui/AgentsPanel';
import { ProcgenPanel } from '../ui/procgenPanel/ProcgenPanel';
import { LibraryPanel } from '../ui/libraryPanel/LibraryPanel';
import {
  AgentLogIcon,
  AgentsIcon,
  LibraryIcon,
  ProcgenIcon,
} from '../ui/icons/panelIcons';
import { FloatingTooltip } from '../ui/tooltips/FloatingTooltip';
import { WorldPanel } from '../ui/worldView/WorldPanel';
import { Panel } from './Panel';
import { PanelResizer } from './PanelResizer';
import { usePanelLayout, type PanelKey } from './usePanelLayout';

interface Column {
  key: PanelKey;
  title: string;
  icon: ReactNode;
  tone: string;
  body: ReactNode;
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
                icon: column.icon,
                tone: column.tone,
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
      title: 'library',
      icon: <LibraryIcon />,
      tone: 'bg-panel',
      body: <LibraryPanel />,
    },
    {
      key: 'procgen',
      title: 'procgen',
      icon: <ProcgenIcon />,
      tone: 'bg-procgen',
      body: <ProcgenPanel />,
    },
    {
      key: 'agents',
      title: 'agents',
      icon: <AgentsIcon />,
      tone: 'bg-panel',
      body: <AgentsPanel selectedId={selectedAgentId} onSelect={onSelectAgent} />,
    },
  ];
  // The log has nothing to show without a selection, so it only claims a column once one exists.
  if (selectedAgentId !== null) {
    columns.push({
      key: 'log',
      title: 'agent log',
      icon: <AgentLogIcon />,
      tone: 'bg-procgen',
      body: <AgentLogPanel selectedId={selectedAgentId} />,
    });
  }
  return columns;
}

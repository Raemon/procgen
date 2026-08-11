import { AgentLogIcon, AgentsIcon } from '@/features/app-shell/icons/panelIcons';
import { PANEL_TIPS } from '@/features/app-shell/help/panelTips';
import { PanelColumn } from '@/features/app-shell/layout/PanelColumn';
import type { PanelLayout } from '@/features/app-shell/layout/usePanelLayout';
import { AgentLogPanel } from './log/AgentLogPanel';
import { AgentLogRail } from './log/AgentLogRail';
import { AgentsPanel } from './panel/AgentsPanel';
import { AgentsRail } from './panel/AgentsRail';

export function Agents({
  selectedId,
  onSelect,
  layout,
}: {
  selectedId: string | null;
  onSelect(id: string | null): void;
  layout: PanelLayout;
}) {
  return (
    <div className="contents">
      <PanelColumn
        panelKey="agents"
        title="agents"
        tip={PANEL_TIPS.agents}
        icon={<AgentsIcon />}
        tone="bg-panel"
        rail={<AgentsRail />}
        layout={layout}
      >
        <AgentsPanel selectedId={selectedId} onSelect={onSelect} />
      </PanelColumn>
      {selectedId ? (
        <PanelColumn
          panelKey="log"
          title="agent log"
          tip={PANEL_TIPS.log}
          icon={<AgentLogIcon />}
          tone="bg-procgen"
          rail={<AgentLogRail selectedId={selectedId} />}
          layout={layout}
        >
          <AgentLogPanel selectedId={selectedId} />
        </PanelColumn>
      ) : null}
    </div>
  );
}

import { useState } from 'react';
import { Agents } from '@/features/agents/Agents';
import { AssetLibrary } from '@/features/asset-library/AssetLibrary';
import { Game } from '@/features/game/Game';
import { FloatingTooltip } from './tooltips/FloatingTooltip';
import { usePanelLayout, type PanelKey } from './layout/usePanelLayout';

export function ProcgenApp() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const layout = usePanelLayout(visiblePanels(selectedAgentId));
  return (
    <>
      <div className="grid h-full" style={{ gridTemplateColumns: layout.gridTemplateColumns }}>
        <AssetLibrary layout={layout} />
        <Agents selectedId={selectedAgentId} onSelect={setSelectedAgentId} layout={layout} />
        <Game />
      </div>
      <FloatingTooltip />
    </>
  );
}

function visiblePanels(selectedAgentId: string | null): PanelKey[] {
  return selectedAgentId
    ? ['library', 'detail', 'agents', 'log']
    : ['library', 'detail', 'agents'];
}

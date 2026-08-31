import { WorldIcon } from '@/features/app-shell/icons/panelIcons';
import { CollapsedRail } from '@/features/app-shell/layout/CollapsedRail';
import type { PanelLayout } from '@/features/app-shell/layout/usePanelLayout';
import { EXPAND_WORLD_VIEW_TIP, GAME_VIEW_TIP } from './panel/help/gameTips';
import { GamePanel } from './panel/GamePanel';
import { WorldsPanel } from './worlds/WorldsPanel';

export function Game({ layout }: { layout: PanelLayout }) {
  return (
    <div className="contents">
      <WorldsPanel layout={layout} />
      {layout.worldViewIsCollapsed ? (
        <FoldedWorldView onExpand={layout.toggleWorldViewCollapsed} />
      ) : (
        <GamePanel onCollapse={layout.toggleWorldViewCollapsed} />
      )}
    </div>
  );
}

function FoldedWorldView({ onExpand }: { onExpand(): void }) {
  return (
    <CollapsedRail
      chrome={{
        title: 'world view',
        tip: GAME_VIEW_TIP,
        icon: <WorldIcon />,
        tone: 'bg-panel',
        rail: null,
        expandTip: EXPAND_WORLD_VIEW_TIP,
        collapsed: true,
        onToggleCollapsed: onExpand,
      }}
    />
  );
}

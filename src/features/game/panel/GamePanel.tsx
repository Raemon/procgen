import { useEffect, useState } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { WorldIcon } from '@/features/app-shell/icons/panelIcons';
import { CollapsedRail } from '@/features/app-shell/layout/CollapsedRail';
import type { PanelChrome } from '@/features/app-shell/layout/Panel';
import type { PanelLayout } from '@/features/app-shell/layout/usePanelLayout';
import { EXPAND_WORLD_VIEW_TIP, GAME_VIEW_TIP } from './help/gameTips';
import { GameHeader } from './GameHeader';
import { GameStage } from './GameStage';
import { isGodView, type ViewMode } from './viewMode';
import { lastUsedViewMode, rememberViewMode } from './viewModePreference';

const GAME_COLUMN_TITLE = 'game';

export function GamePanel({ layout }: { layout: PanelLayout }) {
  const { cameraFocus } = useAppRuntime();
  const [mode, setMode] = useState<ViewMode>(lastUsedViewMode);
  const chooseMode = (next: ViewMode): void => {
    rememberViewMode(next);
    setMode(next);
  };
  useEffect(
    () =>
      cameraFocus.subscribe(() => {
        if (cameraFocus.followedId() !== null) setMode((shown) => (isGodView(shown) ? shown : '3d-god'));
      }),
    [cameraFocus],
  );
  const toggleCollapsed = () => layout.toggleCollapsed('game');
  if (layout.isCollapsed('game'))
    return <CollapsedRail chrome={collapsedGameChrome(toggleCollapsed)} />;
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <GameHeader
        title={GAME_COLUMN_TITLE}
        mode={mode}
        onChooseMode={chooseMode}
        onCollapse={toggleCollapsed}
      />
      <GameStage mode={mode} />
    </div>
  );
}

function collapsedGameChrome(onToggleCollapsed: () => void): PanelChrome {
  return {
    title: GAME_COLUMN_TITLE,
    tip: GAME_VIEW_TIP,
    icon: <WorldIcon />,
    tone: 'bg-panel',
    rail: null,
    expandTip: EXPAND_WORLD_VIEW_TIP,
    collapsed: true,
    onToggleCollapsed,
  };
}

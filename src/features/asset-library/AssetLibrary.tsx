import { DetailIcon, LibraryIcon } from '@/features/app-shell/icons/panelIcons';
import { PANEL_TIPS } from '@/features/app-shell/help/panelTips';
import { PanelColumn } from '@/features/app-shell/layout/PanelColumn';
import type { PanelLayout } from '@/features/app-shell/layout/usePanelLayout';
import { DetailPanel } from './detail/DetailPanel';
import { DetailRail } from './panel/DetailRail';
import { LibraryPanel } from './panel/LibraryPanel';
import { LibraryRail } from './panel/LibraryRail';
import { LibraryViewModeToggle } from './panel/LibraryViewModeToggle';
import { usePersistedLibraryViewMode } from './panel/libraryViewMode';

export function AssetLibrary({ layout }: { layout: PanelLayout }) {
  const [viewMode, setViewMode] = usePersistedLibraryViewMode();
  return (
    <div className="contents">
      <PanelColumn
        panelKey="library"
        title="asset library"
        tip={PANEL_TIPS.library}
        icon={<LibraryIcon />}
        tone="bg-panel"
        rail={<LibraryRail />}
        headerActions={<LibraryViewModeToggle mode={viewMode} onChange={setViewMode} />}
        layout={layout}
      >
        <LibraryPanel viewMode={viewMode} />
      </PanelColumn>
      <PanelColumn
        panelKey="detail"
        title="detail"
        tip={PANEL_TIPS.detail}
        icon={<DetailIcon />}
        tone="bg-procgen"
        rail={<DetailRail />}
        layout={layout}
      >
        <DetailPanel />
      </PanelColumn>
    </div>
  );
}

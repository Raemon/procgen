import { Button } from '../controls/Button';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import type { TooltipContent } from '../tooltips/tooltipContent';

export const LIBRARY_TABS = ['tiles', 'prefabs', 'creatures'] as const;

export type LibraryTab = (typeof LIBRARY_TABS)[number];

const TABS: { tab: LibraryTab; tip: TooltipContent }[] = [
  {
    tab: 'tiles',
    tip: {
      title: 'tiles',
      body: 'The materials every other library is built from: symbol, walkability and cube art.',
    },
  },
  {
    tab: 'prefabs',
    tip: {
      title: 'prefabs',
      body: 'Voxel stamps — buildings, ruins, rock formations — painted layer by layer or captured straight out of the world view.',
    },
  },
  {
    tab: 'creatures',
    tip: {
      title: 'creatures',
      body: 'Things that move. Each one is a look plus a behavior, spawned into the world by any points node.',
    },
  },
];

export function LibraryTabs({
  tab,
  onSelect,
}: {
  tab: LibraryTab;
  onSelect(tab: LibraryTab): void;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5">
      {TABS.map((entry) => (
        <Button
          key={entry.tab}
          active={tab === entry.tab}
          onClick={() => onSelect(entry.tab)}
          {...tooltipHandlers(entry.tip)}
        >
          {entry.tab}
        </Button>
      ))}
    </div>
  );
}

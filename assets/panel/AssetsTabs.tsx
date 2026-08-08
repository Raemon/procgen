import { Button } from '../../frontend/controls/Button';
import type { TooltipContent } from '../../frontend/tooltips/tooltipContent';
import type { AssetKind } from '../asset';

const TABS: { tab: AssetKind; tip: TooltipContent }[] = [
  {
    tab: 'tiles',
    tip: {
      title: 'tiles',
      body: 'The materials every other asset is built from: symbol, walkability and cube art.',
    },
  },
  {
    tab: 'items',
    tip: {
      title: 'items',
      body: 'Pixel art on a transparent background, drawn as a thickened billboard or a floating cube, sized in inventory cells.',
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
  {
    tab: 'characters',
    tip: {
      title: 'characters',
      body: 'Creatures that carry things: the same rules plus an inventory grid of usable, taggable slots.',
    },
  },
];

export function AssetsTabs({
  tab,
  onSelect,
}: {
  tab: AssetKind;
  onSelect(tab: AssetKind): void;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5">
      {TABS.map((entry) => (
        <Button
          key={entry.tab}
          active={tab === entry.tab}
          tip={entry.tip}
          onClick={() => onSelect(entry.tab)}
        >
          {entry.tab}
        </Button>
      ))}
    </div>
  );
}

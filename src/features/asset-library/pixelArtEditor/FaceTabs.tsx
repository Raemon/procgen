import { Button } from '@/features/app-shell/controls/Button';
import type { FaceTab, PaintSettings } from './paintSettings';
import { faceTabTip, linkSidesTip } from './help/paintTips';

const LINKED_TABS: FaceTab[] = ['top', 'sides', 'bottom'];
const UNLINKED_TABS: FaceTab[] = ['top', 'north', 'east', 'south', 'west', 'bottom'];
const TAB_LABELS: Record<FaceTab, string> = {
  top: 'top',
  sides: 'sides',
  bottom: 'bottom',
  north: 'N',
  east: 'E',
  south: 'S',
  west: 'W',
};

const TAB_CLASSES = 'px-2 py-0.5 text-[11px]';

export function FaceTabs({
  settings,
  onSelect,
  onToggleLink,
}: {
  settings: PaintSettings;
  onSelect(tab: FaceTab): void;
  onToggleLink(): void;
}) {
  return (
    <div className="flex flex-1 flex-wrap items-center gap-1">
      {(settings.linkedSides ? LINKED_TABS : UNLINKED_TABS).map((tab) => (
        <Button
          key={tab}
          className={TAB_CLASSES}
          active={settings.faceTab === tab}
          tip={faceTabTip(TAB_LABELS[tab])}
          onClick={() => onSelect(tab)}
        >
          {TAB_LABELS[tab]}
        </Button>
      ))}
      <Button
        className={`${TAB_CLASSES} ml-auto`}
        active={settings.linkedSides}
        tip={linkSidesTip(settings.linkedSides)}
        onClick={onToggleLink}
      >
        🔗
      </Button>
    </div>
  );
}

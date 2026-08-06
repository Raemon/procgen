import { Button } from '../controls/Button';
import type { FaceTab, PaintSettings } from './paintSettings';

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
    <div className="mb-1.5 flex flex-wrap gap-1">
      {(settings.linkedSides ? LINKED_TABS : UNLINKED_TABS).map((tab) => (
        <Button
          key={tab}
          className={TAB_CLASSES}
          active={settings.faceTab === tab}
          onClick={() => onSelect(tab)}
        >
          {TAB_LABELS[tab]}
        </Button>
      ))}
      <Button
        className={`${TAB_CLASSES} ml-auto`}
        active={settings.linkedSides}
        title={linkTitle(settings.linkedSides)}
        onClick={onToggleLink}
      >
        🔗
      </Button>
    </div>
  );
}

function linkTitle(linkedSides: boolean): string {
  return linkedSides
    ? 'sides are linked: unlink to paint N/E/S/W separately'
    : 'link sides: copy the current side to all four and edit them together';
}

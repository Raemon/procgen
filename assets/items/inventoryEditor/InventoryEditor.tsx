import { useState } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnItemChange } from '../../../frontend/rerenderHooks';
import type { CreatureDef } from '../../creatures/creatureDef';
import { MAX_INVENTORY_SIDE, slotAt, type InventoryDef } from '../inventory/inventoryDef';
import { DrawerPanel } from '../../../frontend/controls/DrawerPanel';
import { Button } from '../../../frontend/controls/Button';
import { KnobRow } from '../../../frontend/controls/KnobRow';
import type { TooltipContent } from '../../../frontend/tooltips/tooltipContent';
import {
  GRID_SIDE_TIPS,
  inventoryModeTip,
  REMOVE_INVENTORY_TIP,
  SLOT_TAGS_TIP,
} from './help/inventoryTips';
import { Select } from '../../../frontend/controls/Select';
import { TagsInput } from '../../../frontend/controls/TagsInput';
import { classes } from '../../../frontend/controls/classes';
import { HINT_CLASSES } from '../../../frontend/controls/fieldClasses';
import { SpriteArtEditor } from '../../pixelArtEditor/SpriteArtEditor';
import { InventoryGrid, type GridCell } from './InventoryGrid';
import { INVENTORY_MODES, type InventoryEditorMode } from './inventoryEditorMode';

export function InventoryEditor({ creature }: { creature: CreatureDef }) {
  const { perform } = useAppRuntime();
  if (!creature.inventory) {
    return (
      <DrawerPanel>
        <p className={HINT_CLASSES}>This creature carries nothing.</p>
        <Button
          className="mt-1.5"
          onClick={() => perform('set_inventory', { creature_id: creature.id, width: 6, height: 4 })}
        >
          + give it an inventory
        </Button>
      </DrawerPanel>
    );
  }
  return <InventoryPanel creature={creature} inventory={creature.inventory} />;
}

function InventoryPanel({
  creature,
  inventory,
}: {
  creature: CreatureDef;
  inventory: InventoryDef;
}) {
  const { items, perform } = useAppRuntime();
  useRerenderOnItemChange();
  const [mode, setMode] = useState<InventoryEditorMode>('slots');
  const [selected, setSelected] = useState<GridCell | null>(null);
  const [heldItemId, setHeldItemId] = useState(() => items.all()[0]?.id ?? -1);
  const act = (action: string, params: Record<string, unknown>) =>
    perform(action, { creature_id: creature.id, ...params });

  function clickCell(cell: GridCell): void {
    setSelected(cell);
    if (mode === 'slots') {
      const usable = slotAt(inventory, cell.x, cell.y)?.usable ?? true;
      act('update_inventory_slot', { slot_x: cell.x, slot_y: cell.y, usable: usable ? 0 : 1 });
    }
    if (mode === 'items' && heldItemId >= 0) {
      act('place_inventory_item', { item_id: heldItemId, slot_x: cell.x, slot_y: cell.y });
    }
  }

  function clickPlacement(cell: GridCell): void {
    act('remove_inventory_item', { slot_x: cell.x, slot_y: cell.y });
  }

  return (
    <DrawerPanel>
      <SizeRow creature={creature} inventory={inventory} />
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        {INVENTORY_MODES.map((entry) => (
          <Button
            key={entry.mode}
            className="px-2 py-0.5 text-[11px]"
            tip={inventoryModeTip(entry.label, entry.help)}
            active={mode === entry.mode}
            onClick={() => setMode(entry.mode)}
          >
            {entry.label}
          </Button>
        ))}
        <Button
          className="ml-auto px-2 py-0.5 text-[11px] hover:border-danger-edge hover:text-danger-ink"
          tip={REMOVE_INVENTORY_TIP}
          onClick={() => act('clear_inventory', {})}
        >
          remove
        </Button>
      </div>
      <InventoryGrid
        inventory={inventory}
        items={items}
        mode={mode}
        selected={mode === 'tags' ? selected : null}
        onCellClick={clickCell}
        onPlacementClick={clickPlacement}
      />
      {mode === 'tags' && (
        <SlotTagsRow inventory={inventory} selected={selected} creatureId={creature.id} />
      )}
      {mode === 'items' && (
        <KnobRow className="mt-2" label="item">
          <Select
            value={String(heldItemId)}
            options={items.all().map((item) => ({
              value: String(item.id),
              text: `${item.name} (${item.gridWidth}×${item.gridHeight})`,
            }))}
            onChange={(value) => setHeldItemId(Number(value))}
          />
        </KnobRow>
      )}
      <BackdropRow creature={creature} inventory={inventory} />
      <p className={classes(HINT_CLASSES, 'mt-2')}>{INVENTORY_MODES.find((entry) => entry.mode === mode)!.help}</p>
    </DrawerPanel>
  );
}

function SizeRow({ creature, inventory }: { creature: CreatureDef; inventory: InventoryDef }) {
  const { perform } = useAppRuntime();
  const resize = (patch: { width?: number; height?: number }) =>
    perform('set_inventory', {
      creature_id: creature.id,
      width: patch.width ?? inventory.width,
      height: patch.height ?? inventory.height,
    });
  return (
    <KnobRow
      label="grid"
      tip={{
        title: 'grid',
        body: 'Columns × rows. Shrinking drops the slots — and the items — that fall outside.',
      }}
    >
      <div className="flex items-center gap-1.5">
        <SideSelect
          value={inventory.width}
          tip={GRID_SIDE_TIPS.columns}
          onChange={(width) => resize({ width })}
        />
        <span className="text-ink-dim">×</span>
        <SideSelect
          value={inventory.height}
          tip={GRID_SIDE_TIPS.rows}
          onChange={(height) => resize({ height })}
        />
      </div>
    </KnobRow>
  );
}

function SideSelect({
  value,
  tip,
  onChange,
}: {
  value: number;
  tip: TooltipContent;
  onChange(value: number): void;
}) {
  return (
    <Select
      fullWidth={false}
      tip={tip}
      value={String(value)}
      options={Array.from({ length: MAX_INVENTORY_SIDE }, (_, index) => ({
        value: String(index + 1),
        text: String(index + 1),
      }))}
      onChange={(next) => onChange(Number(next))}
    />
  );
}

function SlotTagsRow({
  inventory,
  selected,
  creatureId,
}: {
  inventory: InventoryDef;
  selected: GridCell | null;
  creatureId: number;
}) {
  const { perform } = useAppRuntime();
  if (!selected) return <p className={classes(HINT_CLASSES, 'mt-2')}>Click a slot to tag it.</p>;
  const slot = slotAt(inventory, selected.x, selected.y);
  if (!slot) return null;
  return (
    <KnobRow className="mt-2" label={`slot ${selected.x},${selected.y}`}>
      <TagsInput
        key={`${creatureId}-${selected.x}-${selected.y}`}
        tags={slot.tags}
        tip={SLOT_TAGS_TIP}
        onChange={(tags) =>
          perform('update_inventory_slot', {
            creature_id: creatureId,
            slot_x: selected.x,
            slot_y: selected.y,
            tags,
          })
        }
      />
    </KnobRow>
  );
}

function BackdropRow({ creature, inventory }: { creature: CreatureDef; inventory: InventoryDef }) {
  const { perform } = useAppRuntime();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mt-2 flex items-center gap-1.5">
        <Button className="px-2 py-0.5 text-[11px]" active={open} onClick={() => setOpen(!open)}>
          backdrop
        </Button>
        <span className={HINT_CLASSES}>
          {inventory.background ? 'art layered under the grid' : 'no art under the grid'}
        </span>
      </div>
      {open && (
        <SpriteArtEditor
          sprite={inventory.background}
          onChange={(sprite) =>
            perform('set_inventory_background', { creature_id: creature.id, sprite })
          }
        />
      )}
    </>
  );
}

import type { InventoryDef, InventorySlot } from '../inventory/inventoryDef';
import type { ItemDef } from '../itemDef';
import type { ReadOnlyItemLibrary } from '../../../frontend/readOnlyLibraries';
import { classes } from '../../../frontend/controls/classes';
import { tooltipHandlers } from '../../../frontend/tooltips/tooltipHandlers';
import { placedItemTip, slotTip } from './help/inventoryTips';
import { ItemSpritePreview } from '../editor/ItemSpritePreview';
import { InventoryBackdrop } from './InventoryBackdrop';
import { footprintRect } from './placementFootprint';
import type { InventoryEditorMode } from './inventoryEditorMode';

export interface GridCell {
  x: number;
  y: number;
}

export function InventoryGrid({
  inventory,
  items,
  mode,
  selected,
  onCellClick,
  onPlacementClick,
}: {
  inventory: InventoryDef;
  items: ReadOnlyItemLibrary;
  mode: InventoryEditorMode;
  selected: GridCell | null;
  onCellClick(cell: GridCell): void;
  onPlacementClick(cell: GridCell): void;
}) {
  return (
    <div
      className="relative grid rounded border border-art-edge bg-black/30"
      style={{ gridTemplateColumns: `repeat(${inventory.width}, minmax(0, 1fr))` }}
    >
      {inventory.background && <InventoryBackdrop background={inventory.background} />}
      {inventory.slots.map((slot, index) => {
        const cell = cellOfIndex(inventory, index);
        return (
          <SlotCell
            key={index}
            slot={slot}
            cell={cell}
            isSelected={isSameCell(selected, cell)}
            onClick={() => onCellClick(cell)}
          />
        );
      })}
      {inventory.placements.map((placement, index) => {
        const item = items.byId(placement.itemId);
        if (!item) return null;
        return (
          <PlacedItem
            key={`${placement.itemId}-${index}`}
            item={item}
            inventory={inventory}
            cell={{ x: placement.x, y: placement.y }}
            interactive={mode === 'items'}
            onClick={() => onPlacementClick({ x: placement.x, y: placement.y })}
          />
        );
      })}
    </div>
  );
}

function SlotCell({
  slot,
  cell,
  isSelected,
  onClick,
}: {
  slot: InventorySlot;
  cell: GridCell;
  isSelected: boolean;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      aria-label={`slot ${cell.x},${cell.y}`}
      onClick={onClick}
      {...tooltipHandlers(slotTip(cell.x, cell.y, slot.usable, slot.tags))}
      className={classes(
        'relative aspect-square min-w-0 border text-[9px] leading-none',
        slot.usable ? 'border-panel-edge/70 bg-field/40' : 'border-black/40 bg-black/60',
        isSelected ? 'outline outline-1 -outline-offset-1 outline-accent' : '',
      )}
    >
      {slot.tags.length > 0 && (
        <span className="pointer-events-none absolute bottom-px right-px text-ink-dim">
          {slot.tags[0]![0]}
        </span>
      )}
    </button>
  );
}

function PlacedItem({
  item,
  inventory,
  cell,
  interactive,
  onClick,
}: {
  item: ItemDef;
  inventory: InventoryDef;
  cell: GridCell;
  interactive: boolean;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      aria-label={item.name}
      onClick={onClick}
      {...tooltipHandlers(placedItemTip(item.name, item.gridWidth, item.gridHeight))}
      style={footprintRect(inventory, item, cell)}
      className={classes(
        'absolute flex items-center justify-center rounded-[2px] border border-accent/60 bg-black/40 p-px',
        interactive ? 'cursor-pointer' : 'pointer-events-none',
      )}
    >
      <ItemSpritePreview item={item} className="max-h-full max-w-full [image-rendering:pixelated]" />
    </button>
  );
}

function cellOfIndex(inventory: InventoryDef, index: number): GridCell {
  return { x: index % inventory.width, y: Math.floor(index / inventory.width) };
}

function isSameCell(selected: GridCell | null, cell: GridCell): boolean {
  return selected !== null && selected.x === cell.x && selected.y === cell.y;
}


import type { ReadOnlyItemLibrary } from '../../frontend/readOnlyLibraries';
import type { InventoryDef, InventorySlot } from '../../library/items/inventory/inventoryDef';
import type { ItemDef } from '../../library/items/itemDef';
import { classes } from '../../frontend/controls/classes';
import { ItemSpritePreview } from '../../library/items/editor/ItemSpritePreview';
import { InventoryBackdrop } from '../../library/items/inventoryEditor/InventoryBackdrop';
import { footprintRect } from '../../library/items/inventoryEditor/placementFootprint';
import { carriedItemTip } from '../../library/items/inventoryEditor/help/inventoryTips';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';

export function CarriedItemsGrid({
  inventory,
  items,
}: {
  inventory: InventoryDef;
  items: ReadOnlyItemLibrary;
}) {
  return (
    <div
      className="relative grid w-[min(26rem,80vw)] rounded border border-art-edge bg-black/40"
      style={{ gridTemplateColumns: `repeat(${inventory.width}, minmax(0, 1fr))` }}
    >
      {inventory.background && <InventoryBackdrop background={inventory.background} />}
      {inventory.slots.map((slot, index) => (
        <EmptySlot key={index} slot={slot} />
      ))}
      {inventory.placements.map((placement, index) => {
        const item = items.byId(placement.itemId);
        if (!item) return null;
        return (
          <CarriedItem
            key={`${placement.itemId}-${index}`}
            item={item}
            inventory={inventory}
            cell={{ x: placement.x, y: placement.y }}
          />
        );
      })}
    </div>
  );
}

function EmptySlot({ slot }: { slot: InventorySlot }) {
  return (
    <div
      className={classes(
        'aspect-square min-w-0 border',
        slot.usable ? 'border-panel-edge/60 bg-field/30' : 'border-black/40 bg-black/60',
      )}
    />
  );
}

function CarriedItem({
  item,
  inventory,
  cell,
}: {
  item: ItemDef;
  inventory: InventoryDef;
  cell: { x: number; y: number };
}) {
  return (
    <div
      {...tooltipHandlers(carriedItemTip(item.name, item.gridWidth, item.gridHeight))}
      style={footprintRect(inventory, item, cell)}
      className="absolute flex items-center justify-center rounded-[2px] border border-accent/60 bg-black/40 p-px"
    >
      <ItemSpritePreview item={item} className="max-h-full max-w-full [image-rendering:pixelated]" />
    </div>
  );
}

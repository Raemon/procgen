import type { ReadOnlyItemAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { InventoryDef, InventorySlot } from '@/features/asset-library/items/inventory/inventoryDef';
import type { ItemDef } from '@/features/asset-library/items/itemDef';
import { classes } from '@/features/app-shell/controls/classes';
import { ItemSpritePreview } from '@/features/asset-library/items/editor/ItemSpritePreview';
import { InventoryBackdrop } from '@/features/asset-library/items/inventoryEditor/InventoryBackdrop';
import { footprintRect } from '@/features/asset-library/items/inventoryEditor/placementFootprint';
import { carriedItemTip } from '@/features/asset-library/items/inventoryEditor/help/inventoryTips';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';

export function CarriedItemsGrid({
  inventory,
  items,
}: {
  inventory: InventoryDef;
  items: ReadOnlyItemAssets;
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

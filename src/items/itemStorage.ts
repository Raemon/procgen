import { readPersistedFile, writePersistedFile } from '../persistence/repoFileStore';
import { isSpriteArt } from '../world/tiles/spriteArt';
import { isCubeFaceArt } from '../world/tiles/tileFaceArt';
import {
  clampGridSide,
  isItemOrientation,
  isItemRender,
  itemWithSanitizedLight,
  newItemWithId,
  normalizedTags,
  type ItemDef,
} from './itemDef';

const FILE_NAME = 'items';

export function loadStoredItems(): ItemDef[] | null {
  return itemsFromStoredJson(readPersistedFile<unknown>(FILE_NAME));
}

export function itemsFromStoredJson(parsed: unknown): ItemDef[] | null {
  if (!Array.isArray(parsed)) return null;
  const items = parsed.filter(hasItemIdentity).map(sanitizedItem);
  return items.length > 0 ? items : null;
}

export function storeItems(items: readonly ItemDef[]): void {
  writePersistedFile(FILE_NAME, items);
}

function hasItemIdentity(value: unknown): value is Partial<ItemDef> & { id: number } {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<ItemDef>;
  return typeof item.id === 'number' && typeof item.name === 'string';
}

function sanitizedItem(stored: Partial<ItemDef> & { id: number }): ItemDef {
  const item = itemWithSanitizedLight({ ...newItemWithId(stored.id), ...stored });
  return {
    ...item,
    render: isItemRender(item.render) ? item.render : newItemWithId(item.id).render,
    orientation: isItemOrientation(item.orientation) ? item.orientation : 0,
    sprite: isSpriteArt(item.sprite) ? item.sprite : null,
    faceArt: isCubeFaceArt(item.faceArt) ? item.faceArt : null,
    gridWidth: clampGridSide(numberOr(item.gridWidth, 1)),
    gridHeight: clampGridSide(numberOr(item.gridHeight, 1)),
    thickness: numberOr(item.thickness, 0.12),
    size: numberOr(item.size, 0.6),
    hover: numberOr(item.hover, 0.35),
    tags: normalizedTags(Array.isArray(item.tags) ? item.tags.filter(isString) : []),
  };
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

import type { ItemDef } from '@/features/asset-library/items/itemDef';
import type { ItemSpawn } from '@/features/asset-library/worlds/worldSampler';
import type { PuzzleRoomLayout } from '../generate/rooms/puzzleRoomLayout';
import type { RoomItem } from '../generate/rooms/roomItem';
import { keyItemId } from './state/roomKeys';
import type { PuzzleState } from './state/puzzleState';

export function keysStillLyingIn(layout: PuzzleRoomLayout, state: PuzzleState): RoomItem[] {
  return layout.items.filter((item) => !state.isOn(keyItemId(layout, item.id)));
}

export function keySpawnsIn(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  key: ItemDef,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): ItemSpawn[] {
  return keysStillLyingIn(layout, state)
    .filter((item) => item.x >= minX && item.x <= maxX && item.y >= minY && item.y <= maxY)
    .map((item) => ({
      x: item.x,
      y: item.y,
      itemId: key.id,
      name: key.name,
      glyph: key.symbol,
      color: key.color,
      tag: 'key',
    }));
}

export function pocketKeysAt(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  x: number,
  y: number,
): string[] {
  const underfoot = keysStillLyingIn(layout, state).filter((item) => item.x === x && item.y === y);
  for (const item of underfoot) state.setOn(keyItemId(layout, item.id), true);
  return underfoot.map((item) => item.id);
}

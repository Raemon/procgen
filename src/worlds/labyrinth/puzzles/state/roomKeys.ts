import type { DoorwaySide } from '@/features/asset-library/worlds/labyrinth/roomLayout';
import type { PuzzleRoomLayout } from '../rooms/puzzleRoomLayout';

export function keyItemId(layout: PuzzleRoomLayout, itemId: string): string {
  return `${layout.key}/${itemId}`;
}

export function unlockedSideId(layout: PuzzleRoomLayout, side: DoorwaySide): string {
  return `${layout.key}/unlocked:${side}`;
}

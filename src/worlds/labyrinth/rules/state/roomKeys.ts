import type { DoorwaySide } from '../../generate/layout/roomLayout';
import type { PuzzleRoomLayout } from '../../generate/rooms/puzzleRoomLayout';

export function keyItemId(layout: PuzzleRoomLayout, itemId: string): string {
  return `${layout.key}/${itemId}`;
}

export function unlockedSideId(layout: PuzzleRoomLayout, side: DoorwaySide): string {
  return `${layout.key}/unlocked:${side}`;
}

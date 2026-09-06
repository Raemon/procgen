export type RoomUnlock = 'signals' | 'key';

export interface RoomItem {
  id: string;
  x: number;
  y: number;
}

export function roomItem(id: string, cell: { x: number; y: number }): RoomItem {
  return { id, x: cell.x, y: cell.y };
}

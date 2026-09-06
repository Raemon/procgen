import type { Layout } from './layout'
import type { Door, Vec } from '../types'
import { makeCanvas, maskToCells, reserve, type RoomCanvas } from '../puzzle/canvas'
import { entryCell } from './deliveryLanes'

export function openDoorways(layout: Layout): RoomCanvas[] {
  const canvases = layout.rooms.map((room) => canvasForRoom(room))
  for (const door of layout.doors) pinDoorOnBothSides(layout, canvases, door)
  return canvases
}

function canvasForRoom(room: { x: number; y: number; w: number; h: number; cells: Vec[] }): RoomCanvas {
  const canvas = makeCanvas(room.w, room.h)
  maskToCells(canvas, room.cells.map((cell) => ({ x: cell.x - room.x, y: cell.y - room.y })))
  return canvas
}

function pinDoorOnBothSides(layout: Layout, canvases: RoomCanvas[], door: Door): void {
  for (const roomId of [door.a, door.b]) pinEntry(layout, canvases[roomId]!, roomId, door)
}

function pinEntry(layout: Layout, canvas: RoomCanvas, roomId: number, door: Door): void {
  const entry = entryCell(layout, roomId, door)
  canvas.entries.push(entry)
  reserve(canvas, entry)
}

import type { RoomRect, Vec } from '../../types'
import { slotKey, slotKeySet, wallCellsToward, type Lattice, type SlotStep } from './lattice'

export function roomFromSlots(id: number, slots: Vec[], lattice: Lattice): RoomRect {
  const cells = interiorCells(slots, lattice)
  const box = boundsOf(cells)
  const slotBox = boundsOf(slots)
  return {
    id,
    x: box.minX,
    y: box.minY,
    w: box.maxX - box.minX + 1,
    h: box.maxY - box.minY + 1,
    slotX: slotBox.minX,
    slotY: slotBox.minY,
    slots,
    cells,
    depth: 0,
  }
}

function boundsOf(points: Vec[]): { minX: number; minY: number; maxX: number; maxY: number } {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

function interiorCells(slots: Vec[], lattice: Lattice): Vec[] {
  const owned = slotKeySet(slots)
  return dedupeCells([
    ...slots.flatMap((slot) => slotInteriorCells(slot, lattice)),
    ...slots.flatMap((slot) => wallsJoiningOwnedSlots(slot, owned, lattice)),
    ...slots.flatMap((slot) => innerCornerCells(slot, owned, lattice)),
  ])
}

function slotInteriorCells(slot: Vec, { roomW, roomH, slotW, slotH }: Lattice): Vec[] {
  const ox = slot.x * slotW + 1
  const oy = slot.y * slotH + 1
  const cells: Vec[] = []
  for (let y = 0; y < roomH; y++) for (let x = 0; x < roomW; x++) cells.push({ x: ox + x, y: oy + y })
  return cells
}

function wallsJoiningOwnedSlots(slot: Vec, owned: Set<string>, lattice: Lattice): Vec[] {
  const cells: Vec[] = []
  if (owned.has(slotKey(slot.x + 1, slot.y))) cells.push(...wallCellsToward(slot, [1, 0], lattice))
  if (owned.has(slotKey(slot.x, slot.y + 1))) cells.push(...wallCellsToward(slot, [0, 1], lattice))
  return cells
}

function innerCornerCells(slot: Vec, owned: Set<string>, { slotW, slotH }: Lattice): Vec[] {
  const corners: readonly SlotStep[] = [[0, 0], [1, 0], [0, 1], [1, 1]]
  const around = corners.filter(([dx, dy]) => owned.has(slotKey(slot.x + dx, slot.y + dy))).length
  return around >= 3 ? [{ x: (slot.x + 1) * slotW, y: (slot.y + 1) * slotH }] : []
}

function dedupeCells(cells: Vec[]): Vec[] {
  const seen = new Set<string>()
  return cells.filter((cell) => {
    const key = slotKey(cell.x, cell.y)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

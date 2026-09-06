import type { GenParams } from '../../params'
import type { Vec } from '../../types'

export interface Lattice {
  roomW: number
  roomH: number
  slotW: number
  slotH: number
}

export type SlotStep = readonly [dx: -1 | 0 | 1, dy: -1 | 0 | 1]

export const SLOT_STEPS: readonly SlotStep[] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

export function latticeFor({ roomW, roomH }: GenParams): Lattice {
  return { roomW, roomH, slotW: roomW + 1, slotH: roomH + 1 }
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

export function slotKey(x: number, y: number): string {
  return `${x},${y}`
}

export function slotKeySet(slots: Vec[]): Set<string> {
  return new Set(slots.map((slot) => slotKey(slot.x, slot.y)))
}

export function wallCellsToward(slot: Vec, [dx, dy]: SlotStep, { roomW, roomH, slotW, slotH }: Lattice): Vec[] {
  if (dx !== 0) {
    const x = (slot.x + Math.max(dx, 0)) * slotW
    const oy = slot.y * slotH + 1
    return range(roomH).map((i) => ({ x, y: oy + i }))
  }
  const y = (slot.y + Math.max(dy, 0)) * slotH
  const ox = slot.x * slotW + 1
  return range(roomW).map((i) => ({ x: ox + i, y }))
}

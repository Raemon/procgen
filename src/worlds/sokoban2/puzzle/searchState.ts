import type { Board } from './board'
import type { FloodResult } from './physics'
import type { PushEvent } from './solver'

export function signature(cells: number[], reach: FloodResult, byReach: boolean): string {
  if (!byReach) return `${cells.join(',')}|${reach.minCell}`
  let key = String.fromCharCode(...cells)
  const words = reach.words
  for (let index = 0; index < words.length; index++) {
    key += String.fromCharCode(words[index]! & 0xffff, words[index]! >>> 16)
  }
  return key
}

export function colorGroups(colors: Int8Array): [[number, number], [number, number]] {
  let red = 0
  for (const color of colors) if (color === 0) red++
  return [
    [0, red],
    [red, colors.length],
  ]
}

export function matches(board: Board, cell: number, color: number): number {
  return board.goalColor[cell] === color ? 1 : 0
}

export function countSatisfied(board: Board, cells: number[], colors: Int8Array): number {
  let count = 0
  for (let index = 0; index < cells.length; index++) count += matches(board, cells[index]!, colors[index]!)
  return count
}

export function aliveCounts(alive: [Uint8Array, Uint8Array], cells: number[], colors: Int8Array): [number, number] {
  const counts: [number, number] = [0, 0]
  for (let index = 0; index < cells.length; index++) counts[colors[index]!]! += alive[colors[index]!]![cells[index]!]!
  return counts
}

export function replaceInGroup(cells: number[], group: [number, number], remove: number, insert: number): number[] {
  const out = cells.slice()
  let cursor = group[0]
  let placed = false
  for (let index = group[0]; index < group[1]; index++) {
    const cell = cells[index]
    if (cell === remove) continue
    if (!placed && insert < cell!) {
      out[cursor++] = insert
      placed = true
    }
    out[cursor++]! = cell!
  }
  if (!placed) out[cursor] = insert
  return out
}

export interface Trail {
  parent: string
  event: PushEvent
}

export function tracePath(cameFrom: Map<string, Trail | null>, signature: string, last: PushEvent): PushEvent[] {
  const events = [last]
  let cursor = cameFrom.get(signature) ?? null
  while (cursor) {
    events.push(cursor.event)
    cursor = cameFrom.get(cursor.parent) ?? null
  }
  return events.reverse()
}

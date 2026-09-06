import type { Board } from '../puzzle/board'
import { advance, createPhysics, holdable, type BoardPhysics } from '../puzzle/physics'
import type { PushEvent } from '../puzzle/solver'

export function boxLinesOf(board: Board, path: PushEvent[]): number {
  const phys = createPhysics(board)
  let lines = 0
  let previousTo = -1
  let previousDelta = 0
  for (const event of path) {
    const delta = event.to - event.from
    if (startsANewLine(phys, event, previousTo, previousDelta)) lines++
    previousTo = event.to
    previousDelta = delta
  }
  return lines
}

function startsANewLine(phys: BoardPhysics, event: PushEvent, previousTo: number, previousDelta: number): boolean {
  const sameCrate = event.from === previousTo
  if (!sameCrate) return true
  const forced = tunnelCell(phys, event.from) && tunnelCell(phys, event.to)
  return event.to - event.from !== previousDelta && !forced
}

function tunnelCell(phys: BoardPhysics, cell: number): boolean {
  const open = phys.deltas.filter((delta) => {
    const next = advance(phys, cell, delta)
    return next >= 0 && holdable(phys, next)
  })
  return open.length === 2 && open[0] === -open[1]!
}

import type { Board } from '../puzzle/board'
import { cellOf } from '../puzzle/board'
import { nodesSpent, solveBoard, type SolveReport } from '../puzzle/solver'
import type { PuzzleDraft } from '../puzzle/draft'

export interface NodeMeter {
  roomRemaining: number
  world: { remaining: number }
}

const METER_EXHAUSTED: SolveReport = { verdict: 'outOfBudget', pushes: null, pushPath: null, nodesUsed: 0 }

export function exhausted(meter: NodeMeter): boolean {
  return meter.roomRemaining <= 0 || meter.world.remaining <= 0
}

export function charge(meter: NodeMeter, nodes: number): void {
  meter.roomRemaining -= nodes
  meter.world.remaining -= nodes
}

export function metered<T>(meter: NodeMeter, run: () => T): T {
  const before = nodesSpent()
  const value = run()
  charge(meter, nodesSpent() - before)
  return value
}

export function meteredSolve(meter: NodeMeter, board: Board, draft: PuzzleDraft, budget: number): SolveReport {
  const allowance = Math.min(budget, meter.roomRemaining, meter.world.remaining)
  if (allowance <= 0) return METER_EXHAUSTED
  return metered(meter, () => solveBoard(board, draft.crates, cellOf(board, draft.player), allowance))
}

import { colorIndex } from '../../types'
import { cellOf, type Board } from '../board'
import type { PushEvent } from '../solver'
import type { PuzzleDraft } from '../draft'
import { makeTrapContext, markWinnable, type CrateState, type TrapOptions } from './lostProofs'
import { TrapCollector, type TemptingTrap } from './trapCollector'
import { collectGreedy, collectLedgePushes, collectOvershoots } from './temptingPushes'
import { collectPrematureCrossing, collectStepStranding } from './orderingTraps'

const TRAP_DEPTH = 4

export function temptingTraps(
  board: Board,
  draft: PuzzleDraft,
  pushPath: PushEvent[] | null = null,
  options: TrapOptions = {},
): TemptingTrap[] {
  const ctx = makeTrapContext(board, options)
  const collector = new TrapCollector(ctx, pushPath)
  const start = startStateOf(board, draft)
  if (pushPath) {
    markWinnable(ctx, start)
    collectOvershoots(ctx, start, pushPath, collector)
    collectLedgePushes(ctx, start, pushPath, collector)
  }
  collectStepStranding(ctx, start, collector)
  collectPrematureCrossing(ctx, start, pushPath, collector)
  collectGreedy(ctx, start, options.maxDepth ?? TRAP_DEPTH, collector)
  return collector.traps
}

export function startStateOf(board: Board, draft: PuzzleDraft): CrateState {
  return {
    cells: draft.crates.map((crate) => crate.cell),
    colors: draft.crates.map((crate) => colorIndex(crate.color)),
    player: cellOf(board, draft.player),
  }
}

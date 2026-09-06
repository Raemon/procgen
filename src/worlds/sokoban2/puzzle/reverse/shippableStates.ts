import { colorIndex } from '../../types'
import { vecOf, type BoardCrate } from '../board'
import { createPhysics, flood, inFlood, stampCrateCells, type BoardPhysics } from '../physics'
import type { PuzzleDraft } from '../draft'
import { preClimbed } from './scriptedPhases'
import { isLedgeScript, type ReverseRun, type ReverseState } from './reverseRun'

export function candidateStates(run: ReverseRun): PuzzleDraft[] {
  const phys = createPhysics(run.board)
  const colors = Int8Array.from(run.colors.map((color) => colorIndex(color)))
  const scored: { draft: PuzzleDraft; onGoal: number; wrongGoal: number }[] = []

  for (let index = Math.max(1, run.earliest); index < run.history.length; index++) {
    const state = run.history[index]
    const shipped = scoreIfShippable(phys, run, colors, state!)
    if (shipped) scored.push(shipped)
  }

  scored.sort((a, b) => a.onGoal - b.onGoal || b.wrongGoal - a.wrongGoal || b.draft.pulls - a.draft.pulls)
  return scored.map((entry) => entry.draft)
}

function scoreIfShippable(
  phys: BoardPhysics,
  run: ReverseRun,
  colors: Int8Array,
  state: ReverseState,
): { draft: PuzzleDraft; onGoal: number; wrongGoal: number } | null {
  const goalColor = run.board.goalColor
  if (state.cells.some((cell) => run.forbiddenRest.has(cell))) return null
  const onGoal = state.cells.filter((cell, crate) => goalColor[cell] === colors[crate]).length
  if (onGoal >= run.goals.length) return null
  stampCrateCells(phys, state.cells, colors)
  if (!reachedFromDoorway(phys, run, state)) return null
  if (!ledgeReady(phys, run, colors, state)) return null
  const wrongGoal = state.cells.filter((cell, crate) => goalColor[cell]! >= 0 && goalColor[cell] !== colors[crate]).length
  return { draft: draftOf(run, state), onGoal, wrongGoal }
}

function reachedFromDoorway(phys: BoardPhysics, run: ReverseRun, state: ReverseState): boolean {
  return run.entries.every((entry) => inFlood(flood(phys, entry, 0), state.player))
}

function ledgeReady(phys: BoardPhysics, run: ReverseRun, colors: Int8Array, state: ReverseState): boolean {
  if (!run.placedLedge) return true
  if (isLedgeScript(run.script) && !run.placedLedge.includes(state.cells[0]!)) return false
  return !preClimbed(phys, colors, run.placedLedge, state)
}

function draftOf(run: ReverseRun, state: ReverseState): PuzzleDraft {
  const crates: BoardCrate[] = state.cells.map((cell, index) => ({ cell, color: run.colors[index]! }))
  return {
    crates,
    goals: run.goals,
    player: vecOf(run.board, state.player),
    pulls: state.pulls,
    ledgeCells: run.ledgeCells,
  }
}

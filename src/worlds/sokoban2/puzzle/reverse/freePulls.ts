import { HEIGHT } from '../../types'
import { vecOf } from '../board'
import { applyPull, last, pullCandidates, pullPath, type Pull } from './pullMoves'
import { isLedgeScript, type Reverse, type ReverseState } from './reverseRun'

const TURNING_BONUS = 2.5
const LAGGARD_BONUS = 2
const SPREAD_WEIGHT = 0.4
const DROP_INVERSE_FACTOR = 3
const STAIR_FACTOR = 2

const STAIR_PENALTY = 0.3
const DECOY_FACTOR = 3
const DECOY_STEPS = 6

const DECOY_TAIL = 3

export function freePulls(rev: Reverse, history: ReverseState[], budget: number): void {
  const pullCounts = new Array(history[0]!.cells.length).fill(0)
  const lastDelta: (number | null)[] = new Array(history[0]!.cells.length).fill(null)
  for (let step = 0; step < budget; step++) {
    const state = last(history)
    const options = pullCandidates(rev, state).filter((pull) => staysUseful(rev, pull))
    if (options.length === 0) return
    const weights = { pullCounts, lastDelta, stairsInPlay: liveStairs(rev, state), tail: step >= budget - DECOY_TAIL }
    const choice = rev.rng.weighted(options, (pull) => weightOf(rev, pull, weights))
    pullCounts[choice.index]++
    lastDelta[choice.index] = choice.delta
    history.push(applyPull(state, choice))
  }
}

function staysUseful(rev: Reverse, pull: Pull): boolean {
  if (!rev.placed || !isLedgeScript(rev.script)) return true
  if (rev.phys.terrain[pull.to] !== HEIGHT.Floor) return true
  return rev.placed.reach[pull.to] === 1
}

function liveStairs(rev: Reverse, state: ReverseState): Set<number> {
  const cells = new Set<number>()
  for (const analysis of rev.ledges) {
    if (!state.cells.some((cell) => analysis.component.member[cell] === 1)) continue
    for (const stair of analysis.stairs) cells.add(stair)
  }
  return cells
}

interface PullWeighting {
  pullCounts: number[]
  lastDelta: (number | null)[]
  stairsInPlay: Set<number>

  tail: boolean
}

function weightOf(rev: Reverse, pull: Pull, weighting: PullWeighting): number {
  const weight = baseWeight(rev, pull, weighting)
  const height = rev.phys.terrain
  if (weighting.tail && rev.decoy && onWrongGoal(rev, pull.index, pull.to)) return weight * DECOY_FACTOR
  if (height[pull.to] === HEIGHT.Ledge && height[pull.from] === HEIGHT.Floor) return weight * DROP_INVERSE_FACTOR
  if (height[pull.to] === HEIGHT.Floor && weighting.stairsInPlay.has(pull.to)) {
    return weight * (rev.placed ? STAIR_PENALTY : STAIR_FACTOR)
  }
  return weight
}

function baseWeight(rev: Reverse, pull: Pull, weighting: PullWeighting): number {
  const { pullCounts, lastDelta } = weighting
  const turning = lastDelta[pull.index] !== null && lastDelta[pull.index] !== pull.delta
  const laggard = pullCounts[pull.index] === Math.min(...pullCounts)
  const goal = vecOf(rev.board, rev.goalCells[pull.index]!)
  const to = vecOf(rev.board, pull.to)
  const spread = Math.abs(to.x - goal.x) + Math.abs(to.y - goal.y)
  return 1 + (turning ? TURNING_BONUS : 0) + (laggard ? LAGGARD_BONUS : 0) + spread * SPREAD_WEIGHT
}

function onWrongGoal(rev: Reverse, index: number, cell: number): boolean {
  const goal = rev.board.goalColor[cell]
  return goal! >= 0 && goal !== rev.colors[index]
}

export function decoyFinish(rev: Reverse, history: ReverseState[]): void {
  if (!rev.decoy) return
  const state = last(history)
  for (const index of rev.rng.shuffle(state.cells.map((_, crate) => crate))) {
    const path = decoyPathFor(rev, state, index)
    if (path) return void history.push(...path)
  }
}

function decoyPathFor(rev: Reverse, state: ReverseState, index: number): ReverseState[] | null {
  for (const goal of rev.rng.shuffle(wrongGoals(rev, index))) {
    if (state.cells.includes(goal) || gap(rev, state.cells[index]!, goal) > DECOY_STEPS) continue
    const path = pullPath(rev, state, index, (cell) => cell === goal, DECOY_STEPS, 1)
    if (path) return path
  }
  return null
}

function wrongGoals(rev: Reverse, index: number): number[] {
  return rev.goalCells.filter((_, goal) => rev.colors[goal] !== rev.colors[index])
}

function gap(rev: Reverse, from: number, to: number): number {
  const a = vecOf(rev.board, from)
  const b = vecOf(rev.board, to)
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

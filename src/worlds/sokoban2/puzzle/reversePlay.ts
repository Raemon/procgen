import { colorIndex } from '../types'
import { toBoard, type RoomCanvas } from './canvas'
import { createPhysics } from './physics'
import { ledgeAnalyses } from './deadSquares'
import type { PuzzleDraft } from './draft'
import { goalPlans, type GoalPlan } from './reverse/goalPlans'
import { startCell } from './reverse/pullMoves'
import { decoyFinish, freePulls } from './reverse/freePulls'
import { dividedPhases, scriptedPhases } from './reverse/scriptedPhases'
import { candidateStates } from './reverse/shippableStates'
import {
  climbCells,
  entryCells,
  isLedgeScript,
  ledgeCellsOf,
  matchingLedge,
  stepsFor,
  useLevers,
  worst,
  type PullScript,
  type Reverse,
  type ReverseOptions,
  type ReverseRun,
  type ReverseStall,
  type ReverseState,
} from './reverse/reverseRun'

export type { PullScript, ReverseOptions, ReverseRun, ReverseStall, ReverseState } from './reverse/reverseRun'

const RUN_ATTEMPTS = 6
const DECOY_CHANCE = 0.5

export function buildPuzzle(canvas: RoomCanvas, options: ReverseOptions): PuzzleDraft | null {
  for (let attempt = 0; attempt < RUN_ATTEMPTS; attempt++) {
    const run = runReverse(canvas, options)
    const best = run ? candidateStates(run)[0] : undefined
    if (best) return best
  }
  return null
}

export function runReverse(canvas: RoomCanvas, options: ReverseOptions): ReverseRun | null {
  const script = options.script ?? 'classic'
  const planning = goalPlans(canvas, options, script)
  if (planning.plans.length === 0) {
    options.onStall?.(planning.stall)
    return null
  }
  let stall = planning.stall
  for (const plan of planning.plans) {
    const attempt = runPlan(canvas, options, script, plan)
    if (typeof attempt !== 'string') return attempt
    stall = worst(stall, attempt)
  }
  options.onStall?.(stall)
  return null
}

function runPlan(
  canvas: RoomCanvas,
  options: ReverseOptions,
  script: PullScript,
  plan: GoalPlan,
): ReverseRun | ReverseStall {
  const rev = startReverse(canvas, options, script, plan)
  if (isLedgeScript(script) && (!rev.placed || rev.landing < 0)) return 'ledgeMatch'
  const cells = rev.goalCells.slice()
  const start = startCell(rev, cells, rev.entries)
  if (start === null) return 'start'

  const history: ReverseState[] = [{ cells, player: start, pulls: 0 }]
  const earliest = runPhases(rev, options, history)
  if (earliest < 0) return rev.stall
  return shipRun(rev, options, plan, history, earliest)
}

function startReverse(canvas: RoomCanvas, options: ReverseOptions, script: PullScript, plan: GoalPlan): Reverse {
  const board = toBoard(canvas, plan.goals)
  const phys = createPhysics(board)
  const ledges = ledgeAnalyses(board, phys)
  const placed = options.ledge ? matchingLedge(ledges, options.ledge) : null
  const decoy = useLevers(options) && (options.lever ? options.lever === 'decoy' : options.rng.bool(DECOY_CHANCE))
  return {
    board,
    phys,
    colors: Int8Array.from(plan.goals.map((goal) => colorIndex(goal.color))),
    goals: plan.goals,
    goalCells: plan.goals.map((goal) => goal.y * board.w + goal.x),
    ledges,
    placed,
    steps: new Set(options.ledge ? stepsFor(canvas, options.ledge, script) : []),
    climbs: placed ? climbCells(phys, placed) : new Set<number>(),
    entries: entryCells(canvas),
    landing: plan.landing ?? -1,
    script,
    rng: options.rng,
    stall: 'goals',
    decoy,
  }
}

function shipRun(
  rev: Reverse,
  options: ReverseOptions,
  plan: GoalPlan,
  history: ReverseState[],
  earliest: number,
): ReverseRun {
  return {
    board: rev.board,
    goals: plan.goals,
    colors: plan.goals.map((goal) => goal.color),
    history,
    earliest,
    ledgeCells: ledgeCellsOf(rev.phys),
    entries: rev.entries,
    script: rev.script,
    forbiddenRest: options.forbiddenRest ?? new Set<number>(),
    placedLedge: rev.placed ? rev.placed.component.cells : null,
  }
}

function runPhases(rev: Reverse, options: ReverseOptions, history: ReverseState[]): number {
  const budget = options.pullEffort * history[0]!.cells.length
  const scripted = phasesFor(rev, history[0]!)
  if (scripted === 'none') return finishFreely(rev, history, budget, 1)
  if (!scripted) return -1
  history.push(...scripted)
  return finishFreely(rev, history, budget, history.length - 1)
}

function phasesFor(rev: Reverse, start: ReverseState): ReverseState[] | null | 'none' {
  if (rev.script === 'divided') return rev.placed ? dividedPhases(rev, start) : 'none'
  return isLedgeScript(rev.script) ? scriptedPhases(rev, start) : 'none'
}

function finishFreely(rev: Reverse, history: ReverseState[], budget: number, cut: number): number {
  freePulls(rev, history, budget)
  decoyFinish(rev, history)
  return cut
}

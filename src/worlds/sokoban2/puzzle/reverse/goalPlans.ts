import { DIRS, DIR_LIST, HEIGHT, colorIndex, type Goal, type Vec } from '../../types'
import {
  at,
  cellsWhere,
  floorComponents,
  heightAt,
  holdable as canvasHoldable,
  isFloor,
  isReserved,
  toBoard,
  type RoomCanvas,
} from '../canvas'
import { aliveByColor } from '../deadSquares'
import { climbableStairs, type LedgePlacement } from '../ledges'
import {
  homeComponent,
  isLedgeScript,
  same,
  useLevers,
  worst,
  type PullScript,
  type ReverseOptions,
  type ReverseStall,
} from './reverseRun'

export interface GoalPlan {
  goals: Goal[]
  landing?: number
}

export interface Planning {
  plans: GoalPlan[]

  stall: ReverseStall
}

const POCKET_CHANCE = 0.5
const PHASE_STEPS = 3
const STEP_GOAL_GAP = 3

const PLANS_PER_RUN = 6
const STEP_GOAL_TRIES = 4

const STEP_LINE_STEPS = 4

export function goalPlans(canvas: RoomCanvas, options: ReverseOptions, script: PullScript): Planning {
  const count = Math.max(1, options.crateCount)
  const forbidden = options.forbiddenRest ?? new Set<number>()
  const pool = options.rng.shuffle(cellsWhere(canvas, (cell) => goalCell(canvas, cell, forbidden)))
  if (script === 'ledgeTop') return ledgeTopPlans(canvas, options, pool, count)
  if (isLedgeScript(script)) return ledgePlans(canvas, options, script, pool, count)
  if (script === 'divided' && options.ledge) return dividedPlans(canvas, options, pool, count)
  return flatPlan(canvas, options, script, pool, count)
}

function flatPlan(canvas: RoomCanvas, options: ReverseOptions, script: PullScript, pool: Vec[], count: number): Planning {
  const seeds = [...farSideGoal(canvas, options, script, pool), ...pocketSeed(canvas, options, pool, count)]
  const spots = spacedPick(pool, count, seeds)
  if (spots.length < count) return { plans: [], stall: 'goals' }
  return { plans: [{ goals: spots.map((cell, index) => colored(cell, options, index)) }], stall: 'goals' }
}

function pocketSeed(canvas: RoomCanvas, options: ReverseOptions, pool: Vec[], count: number): Vec[] {
  if (count < 2 || !useLevers(options)) return []
  if (options.lever ? options.lever !== 'pocket' : !options.rng.bool(POCKET_CHANCE)) return []
  const pockets = pool.filter((cell) => openSides(canvas, cell) === 1)
  if (pockets.length === 0) return []
  return [pockets.sort((a, b) => mouthOpen(canvas, b) - mouthOpen(canvas, a))[0]!]
}

function mouthOpen(canvas: RoomCanvas, cell: Vec): number {
  const mouth = DIR_LIST.map((dir) => ({ x: cell.x + DIRS[dir].x, y: cell.y + DIRS[dir].y })).find((next) =>
    canvasHoldable(canvas, next),
  )
  return mouth ? openSides(canvas, mouth) : 0
}

function openSides(canvas: RoomCanvas, cell: Vec): number {
  return DIR_LIST.filter((dir) => canvasHoldable(canvas, { x: cell.x + DIRS[dir].x, y: cell.y + DIRS[dir].y })).length
}

function goalCell(canvas: RoomCanvas, cell: Vec, forbidden: Set<number>): boolean {
  if (!isFloor(canvas, cell) || isReserved(canvas, cell)) return false
  const id = at(canvas, cell.x, cell.y)
  if (canvas.channel[id] || forbidden.has(id)) return false
  return canBePulledFrom(canvas, cell)
}

function dividedPlans(canvas: RoomCanvas, options: ReverseOptions, pool: Vec[], count: number): Planning {
  const placement = options.ledge
  const far = farSideGoal(canvas, options, 'divided', pool)
  if (!placement || far.length === 0 || count < 2) return { plans: [], stall: 'goals' }
  const home = homeComponent(canvas)
  const steps = new Set(climbableStairs(canvas, placement).filter((cell) => !home || home.has(cell)))
  const near = pool.filter((cell) => !home || home.has(at(canvas, cell.x, cell.y)))
  const plans: GoalPlan[] = []
  for (const goalS of stepGoals(canvas, placement, 'stepFirst', near, steps, far[0]!)) {
    if (plans.length >= PLANS_PER_RUN) break
    const spots = spacedPick(pool.filter((cell) => !same(cell, goalS)), count, [far[0]!, goalS])
    if (spots.length < count) continue
    plans.push({ goals: spots.map((cell, index) => colored(cell, options, index)) })
  }
  return { plans, stall: plans.length > 0 ? 'goalsSpots' : 'goalsStep' }
}

function farSideGoal(canvas: RoomCanvas, options: ReverseOptions, script: PullScript, pool: Vec[]): Vec[] {
  if (script !== 'divided' || !options.ledge) return []
  const groups = floorComponents(canvas)
  const entries = canvas.entries.map((entry) => at(canvas, entry.x, entry.y))
  const far = groups.find((group) => !entries.some((id) => group.has(id)))
  if (!far || groups.length < 2) return []
  const inFar = pool.filter((cell) => far.has(at(canvas, cell.x, cell.y)))
  const face = inFar.filter((cell) => farFrom(options.ledge as LedgePlacement, cell) === 1)
  const chosen = face[0] ?? inFar[0]
  return chosen ? [chosen] : []
}

function canBePulledFrom(canvas: RoomCanvas, cell: Vec): boolean {
  return DIR_LIST.some((dir) => {
    const delta = DIRS[dir]
    const behind = { x: cell.x + delta.x, y: cell.y + delta.y }
    const beyond = { x: cell.x + delta.x * 2, y: cell.y + delta.y * 2 }
    if (!canvasHoldable(canvas, behind)) return false
    if (heightAt(canvas, behind) < heightAt(canvas, cell)) return false
    return heightAt(canvas, beyond) === heightAt(canvas, behind)
  })
}

function colored(cell: Vec, options: ReverseOptions, index: number): Goal {
  const color = options.colors[index % options.colors.length] ?? 'red'
  return { x: cell.x, y: cell.y, color }
}

function ledgePlans(canvas: RoomCanvas, options: ReverseOptions, script: PullScript, pool: Vec[], count: number): Planning {
  const placement = options.ledge
  if (!placement || count < 2) return { plans: [], stall: 'goals' }
  const forbidden = options.forbiddenRest ?? new Set<number>()
  const steps = new Set(climbableStairs(canvas, placement))
  const plans: GoalPlan[] = []
  let stall: ReverseStall = 'goals'

  for (const landing of placement.landings) {
    if (plans.length >= PLANS_PER_RUN) break
    if (!goalCell(canvas, landing, forbidden)) continue
    stall = worst(stall, 'goalsLanding')
    stall = worst(stall, plansForLanding(canvas, options, script, placement, pool, steps, landing, count, plans))
  }
  return { plans, stall }
}

function plansForLanding(
  canvas: RoomCanvas,
  options: ReverseOptions,
  script: PullScript,
  placement: LedgePlacement,
  pool: Vec[],
  steps: Set<number>,
  landing: Vec,
  count: number,
  plans: GoalPlan[],
): ReverseStall {
  const goalX = dropGoal(canvas, options, pool, landing)
  let stall: ReverseStall = 'goalsLanding'
  for (const goalS of stepGoals(canvas, placement, script, pool, steps, goalX)) {
    if (plans.length >= PLANS_PER_RUN) break
    stall = worst(stall, 'goalsStep')
    const rest = pool.filter((cell) => !same(cell, goalX) && !same(cell, goalS))
    const pocket = count > 2 ? pocketSeed(canvas, options, rest, count) : []
    const spots = spacedPick(rest, count, [goalX, goalS, ...pocket])
    if (spots.length < count) continue
    stall = worst(stall, 'goalsSpots')
    plans.push({ goals: spots.map((cell, index) => colored(cell, options, index)), landing: at(canvas, landing.x, landing.y) })
  }
  return stall
}

function ledgeTopPlans(canvas: RoomCanvas, options: ReverseOptions, pool: Vec[], count: number): Planning {
  const placement = options.ledge
  if (!placement || count < 2) return { plans: [], stall: 'goals' }
  const steps = new Set(climbableStairs(canvas, placement))
  const tops = options.rng.shuffle(placement.cells.filter((cell) => heightAt(canvas, cell) === HEIGHT.Ledge && canBePulledFrom(canvas, cell)))
  const plans: GoalPlan[] = []
  let stall: ReverseStall = 'goals'
  for (const goalX of tops) {
    if (plans.length >= PLANS_PER_RUN) break
    stall = worst(stall, 'goalsLanding')
    for (const goalS of stepGoals(canvas, placement, 'stepFirst', pool, steps, goalX)) {
      if (plans.length >= PLANS_PER_RUN) break
      stall = worst(stall, 'goalsStep')
      const rest = pool.filter((cell) => !same(cell, goalS))
      const pocket = count > 2 ? pocketSeed(canvas, options, rest, count) : []
      const spots = spacedPick(rest, count, [goalX, goalS, ...pocket])
      if (spots.length < count) continue
      stall = worst(stall, 'goalsSpots')
      plans.push({ goals: spots.map((cell, index) => colored(cell, options, index)), landing: at(canvas, goalX.x, goalX.y) })
    }
  }
  return { plans, stall }
}

function stepGoals(
  canvas: RoomCanvas,
  placement: LedgePlacement,
  script: PullScript,
  pool: Vec[],
  steps: Set<number>,
  goalX: Vec,
): Vec[] {
  const free = pool.filter((cell) => !same(cell, goalX))
  if (script === 'ledgeDrop') {
    return free.filter((cell) => steps.has(at(canvas, cell.x, cell.y))).slice(0, STEP_GOAL_TRIES)
  }
  const open = new Set(free.map((cell) => at(canvas, cell.x, cell.y)))
  const online = pullLineGoals(canvas, placement, steps, open)
  const away = free
    .filter((cell) => !steps.has(at(canvas, cell.x, cell.y)) && farFrom(placement, cell) >= STEP_GOAL_GAP - 1)
    .sort((a, b) => farFrom(placement, a) - farFrom(placement, b))
  return dedupeCells(canvas, [...online, ...away]).slice(0, STEP_GOAL_TRIES)
}

function dedupeCells(canvas: RoomCanvas, cells: Vec[]): Vec[] {
  const seen = new Set<number>()
  return cells.filter((cell) => {
    const id = at(canvas, cell.x, cell.y)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function pullLineGoals(canvas: RoomCanvas, placement: LedgePlacement, steps: Set<number>, open: Set<number>): Vec[] {
  const found: { cell: Vec; gap: number }[] = []
  for (const step of steps) {
    const stair = { x: step % canvas.w, y: Math.floor(step / canvas.w) }
    for (const dir of DIR_LIST) collectPullLine(canvas, placement, steps, open, stair, DIRS[dir], found)
  }
  return found.sort((a, b) => b.gap - a.gap).map((entry) => entry.cell)
}

function collectPullLine(
  canvas: RoomCanvas,
  placement: LedgePlacement,
  steps: Set<number>,
  open: Set<number>,
  stair: Vec,
  delta: Vec,
  found: { cell: Vec; gap: number }[],
): void {
  if (!isFloor(canvas, { x: stair.x - delta.x, y: stair.y - delta.y })) return
  for (let far = 1; far <= STEP_LINE_STEPS; far++) {
    const cell = { x: stair.x + delta.x * far, y: stair.y + delta.y * far }
    if (!isFloor(canvas, cell)) return
    const id = at(canvas, cell.x, cell.y)
    if (open.has(id) && !steps.has(id)) found.push({ cell, gap: farFrom(placement, cell) })
  }
}

function dropGoal(canvas: RoomCanvas, options: ReverseOptions, pool: Vec[], landing: Vec): Vec {
  const color = options.colors[0] ?? 'red'
  const landingId = at(canvas, landing.x, landing.y)
  const gapTo = (cell: Vec) => Math.abs(cell.x - landing.x) + Math.abs(cell.y - landing.y)
  const near = pool.filter((cell) => gapTo(cell) >= 1 && gapTo(cell) <= PHASE_STEPS).sort((a, b) => gapTo(b) - gapTo(a))
  for (const cell of near) {
    const board = toBoard(canvas, [{ x: cell.x, y: cell.y, color }])
    if (aliveByColor(board)[colorIndex(color)]![landingId] === 1) return cell
  }
  return landing
}

export function farFrom(placement: LedgePlacement, cell: Vec): number {
  return Math.min(...placement.cells.map((ledge) => Math.abs(ledge.x - cell.x) + Math.abs(ledge.y - cell.y)))
}

function spacedPick(pool: Vec[], count: number, taken: Vec[]): Vec[] {
  const picked = [...taken]
  for (const spacing of [2, 1, 0]) {
    for (const cell of pool) {
      if (picked.length >= count) break
      if (picked.some((spot) => Math.abs(spot.x - cell.x) + Math.abs(spot.y - cell.y) <= spacing)) continue
      picked.push(cell)
    }
    if (picked.length >= count) break
  }
  return picked.slice(0, count)
}

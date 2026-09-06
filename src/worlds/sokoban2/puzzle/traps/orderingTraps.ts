import { HEIGHT, colorIndex } from '../../types'
import { cellOf, makeBoard, type BoardCrate } from '../board'
import { colorName, flood, inFlood, stampCrateCells } from '../physics'
import type { LedgeAnalysis } from '../deadSquares'
import type { FloorComponent } from '../floorShape'
import { solveBoard, type PushEvent } from '../solver'
import { markWinnable, moveCrate, type CrateState, type TrapContext } from './lostProofs'
import type { TrapCollector } from './trapCollector'

const STEP_HOME_PUSHES = 6
const STEP_SOLVE_BUDGET = 2000

export function collectStepStranding(ctx: TrapContext, start: CrateState, collector: TrapCollector): void {
  for (const ledge of ctx.ledges) {
    if (!ledgeInPlay(ctx, start, ledge)) continue
    for (const index of stepCrates(ctx, start, ledge)) {
      const home = soloHome(ctx, start, index)
      if (!home) continue
      collector.claim('stepStranding', home.from, home.after.cells[index]!, home.depth, start.colors[index]!, home.before, home.after)
      if (collector.full) return
    }
  }
}

function stepCrates(ctx: TrapContext, state: CrateState, ledge: LedgeAnalysis): number[] {
  const found: number[] = []
  for (let index = 0; index < state.cells.length; index++) {
    const cell = state.cells[index]
    if (ctx.phys.terrain[cell!] !== HEIGHT.Floor || ledge.reach[cell!] !== 1) continue
    if (ctx.board.goalColor[cell!] === state.colors[index]) continue
    found.push(index)
  }
  return found
}

function ledgeInPlay(ctx: TrapContext, state: CrateState, ledge: LedgeAnalysis): boolean {
  for (const cell of ledge.component.cells) if (ctx.board.goalColor[cell]! >= 0) return true
  for (const cell of state.cells) if (ledge.component.member[cell] === 1) return true
  return false
}

interface SoloRun {
  before: CrateState
  after: CrateState
  from: number
  depth: number
}

function soloHome(ctx: TrapContext, start: CrateState, index: number): SoloRun | null {
  const best = shortestSoloLine(ctx, start, index)
  if (!best) return null
  const last = best[best.length - 1]
  let before = start
  for (const event of best.slice(0, -1)) before = moveCrate(before, index, event.to)
  before = { cells: before.cells, colors: before.colors, player: last!.standing }
  return { before, after: moveCrate(before, index, last!.to), from: last!.from, depth: best.length }
}

function shortestSoloLine(ctx: TrapContext, start: CrateState, index: number): PushEvent[] | null {
  const color = start.colors[index]
  const height = frozenExcept(ctx, start, index)
  const crate: BoardCrate[] = [{ cell: start.cells[index]!, color: colorName(color!) }]
  let best: PushEvent[] | null = null
  for (const goal of ctx.board.goals) {
    if (colorIndex(goal.color) !== color || height[cellOf(ctx.board, goal)]! > HEIGHT.Ledge) continue
    const solo = makeBoard(ctx.board.w, ctx.board.h, height, [goal])
    const report = solveBoard(solo, crate, start.player, STEP_SOLVE_BUDGET)
    if (report.verdict !== 'solved' || !report.pushPath || report.pushPath.length > STEP_HOME_PUSHES) continue
    if (!best || report.pushPath.length < best.length) best = report.pushPath
  }
  return best
}

function frozenExcept(ctx: TrapContext, start: CrateState, index: number): Int32Array {
  const height = Int32Array.from(ctx.board.height)
  for (const [other, cell] of start.cells.entries()) if (other !== index) height[cell] = HEIGHT.Wall + 1
  return height
}

export function collectPrematureCrossing(
  ctx: TrapContext,
  start: CrateState,
  path: PushEvent[] | null,
  collector: TrapCollector,
): void {
  if (ctx.components.length < 2) return
  const home = ctx.components.find((component) => component.member[start.player] === 1)
  if (!home) return
  const steps = path ?? []
  for (let step = 0; step <= steps.length; step++) {
    const state = replayTo(start, steps, step)
    if (!state) return
    if (claimCrossingAt(ctx, state, home, Math.max(step, 1), collector)) return
  }
}

function claimCrossingAt(
  ctx: TrapContext,
  state: CrateState,
  home: FloorComponent,
  depth: number,
  collector: TrapCollector,
): boolean {
  const stranded = unmetGoal(ctx, state, home.member)
  if (stranded < 0) return false
  markWinnable(ctx, state)
  stampCrateCells(ctx.phys, state.cells, state.colors)
  const reach = flood(ctx.phys, state.player, 0)
  for (const component of ctx.components) {
    if (component === home || unmetGoal(ctx, state, component.member) < 0) continue
    const target = component.cells.find((cell) => inFlood(reach, cell))
    if (target === undefined) continue
    const crossed: CrateState = { cells: state.cells, colors: state.colors, player: target }
    collector.claim('prematureCrossing', state.player, target, depth, ctx.board.goalColor[stranded]!, state, crossed)
    return true
  }
  return false
}

function replayTo(state: CrateState, path: PushEvent[], stop: number): CrateState | null {
  let cursor = state
  for (let step = 0; step < stop; step++) {
    const index = cursor.cells.indexOf(path[step]!.from)
    if (index < 0) return null
    cursor = moveCrate(cursor, index, path[step]!.to)
  }
  return cursor
}

function unmetGoal(ctx: TrapContext, state: CrateState, member: Uint8Array): number {
  for (const goal of ctx.board.goals) {
    const cell = cellOf(ctx.board, goal)
    if (member[cell] !== 1 || satisfiedAt(ctx, state, cell)) continue
    return cell
  }
  return -1
}

function satisfiedAt(ctx: TrapContext, state: CrateState, cell: number): boolean {
  for (let index = 0; index < state.cells.length; index++) {
    if (state.cells[index] === cell && state.colors[index] === ctx.board.goalColor[cell]) return true
  }
  return false
}

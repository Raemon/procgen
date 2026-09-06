import type { Board } from '../board'
import { PUSH_STRIDE, advance, createPhysics, flood, holdable, stampCrateCells, type BoardPhysics } from '../physics'
import {
  aliveByColor,
  cellsLost,
  colorDistance,
  frozenAt,
  ledgeAnalyses,
  makeLossCheck,
  type AliveByColor,
  type DistanceByColor,
  type LedgeAnalysis,
  type LossCheck,
} from '../deadSquares'
import { boardCrates, solveBoard } from '../solver'
import { flattenBoard, floorComponents, type FloorComponent } from '../floorShape'

export type TrapKind =
  | 'overshoot'
  | 'greedy'
  | 'colorMismatch'
  | 'wrongEdgeDrop'
  | 'stepStranding'
  | 'prematureCrossing'

export type TrapProof = 'deadSquare' | 'deficit' | 'freeze' | 'strandedLedge' | 'exhaustion'

export interface TrapOptions {
  maxDepth?: number
  exhaustionBudget?: number
  maxExhaustionTraps?: number

  verifyBudget?: number
  maxVerifySolves?: number
}

const EXHAUSTION_BUDGET = 10000
const MAX_EXHAUSTION_TRAPS = 6
const VERIFY_BUDGET = 6000
const MAX_VERIFY_SOLVES = 8

export interface CrateState {
  cells: number[]
  colors: number[]
  player: number
}

export interface TrapContext {
  board: Board
  phys: BoardPhysics
  check: LossCheck
  alive: AliveByColor
  flatAlive: AliveByColor
  own: DistanceByColor
  blind: Int32Array
  ledges: LedgeAnalysis[]
  components: FloorComponent[]
  buffer: Int32Array
  exhaustionBudget: number
  exhaustionLeft: number
  verifyBudget: number
  verifyLeft: number

  solvable: Map<string, boolean>
}

export function makeTrapContext(board: Board, options: TrapOptions): TrapContext {
  const phys = createPhysics(board)
  const own = colorDistance(board, phys)
  return {
    board,
    phys,
    check: makeLossCheck(board, phys),
    alive: aliveByColor(board, phys),
    flatAlive: aliveByColor(flattenBoard(board)),
    own,
    blind: Int32Array.from(own[0], (value, cell) => Math.min(value, own[1][cell]!)),
    ledges: ledgeAnalyses(board, phys),
    components: floorComponents(board, phys),
    buffer: new Int32Array(4 * PUSH_STRIDE),
    exhaustionBudget: options.exhaustionBudget ?? EXHAUSTION_BUDGET,
    exhaustionLeft: options.maxExhaustionTraps ?? MAX_EXHAUSTION_TRAPS,
    verifyBudget: options.verifyBudget ?? VERIFY_BUDGET,
    verifyLeft: options.maxVerifySolves ?? MAX_VERIFY_SOLVES,
    solvable: new Map<string, boolean>(),
  }
}

export function moveCrate(state: CrateState, index: number, to: number): CrateState {
  const cells = state.cells.slice()
  const player = cells[index]
  cells[index] = to
  return { cells, colors: state.colors, player: player! }
}

function stateKey(state: CrateState): string {
  return `${state.cells.join(',')}|${state.colors.join('')}|${state.player}`
}

export function stillWinnable(ctx: TrapContext, state: CrateState): boolean {
  const key = stateKey(state)
  const known = ctx.solvable.get(key)
  if (known !== undefined) return known
  if (ctx.verifyLeft <= 0) return false
  ctx.verifyLeft--
  const report = solveBoard(ctx.board, boardCrates(state.cells, state.colors), state.player, ctx.verifyBudget)
  const winnable = report.verdict === 'solved'
  ctx.solvable.set(key, winnable)
  return winnable
}

export function markWinnable(ctx: TrapContext, state: CrateState): void {
  ctx.solvable.set(stateKey(state), true)
}

export function proveLost(ctx: TrapContext, state: CrateState): TrapProof | null {
  const { cells, colors } = state
  stampCrateCells(ctx.phys, cells, colors)
  if (satisfiedCount(ctx.board, cells, colors) === ctx.board.goals.length) return null
  if (cellsLost(ctx.check, cells, colors)) return 'deadSquare'
  if (deficitLost(ctx, cells, colors)) return 'deficit'
  if (freezeLost(ctx, cells, colors)) return 'freeze'
  const reach = flood(ctx.phys, state.player, 0)
  if (cellsLost(ctx.check, cells, colors, reach)) return 'strandedLedge'
  return exhaustionLost(ctx, state)
}

function exhaustionLost(ctx: TrapContext, state: CrateState): TrapProof | null {
  if (ctx.exhaustionLeft <= 0) return null
  ctx.exhaustionLeft--
  const crates = boardCrates(state.cells, state.colors)
  const report = solveBoard(ctx.board, crates, state.player, ctx.exhaustionBudget)
  return report.verdict === 'provablyUnsolvable' ? 'exhaustion' : null
}

function satisfiedCount(board: Board, cells: number[], colors: number[]): number {
  let count = 0
  for (let index = 0; index < cells.length; index++) if (board.goalColor[cells[index]!] === colors[index]) count++
  return count
}

function deficitLost(ctx: TrapContext, cells: number[], colors: number[]): boolean {
  for (const component of ctx.components) {
    const need = goalsInComponent(ctx, component)
    if (need[0] === 0 && need[1] === 0) continue
    const supply: [number, number] = [0, 0]
    for (let index = 0; index < cells.length; index++) {
      if (component.supply[cells[index]!] === 1) supply[colors[index]!]!++
    }
    if (supply[0] < need[0] || supply[1] < need[1]) return true
  }
  return false
}

function goalsInComponent(ctx: TrapContext, component: FloorComponent): [number, number] {
  const need: [number, number] = [0, 0]
  for (const cell of component.cells) if (ctx.board.goalColor[cell]! >= 0) need[ctx.board.goalColor[cell]!]!++
  return need
}

function freezeLost(ctx: TrapContext, cells: number[], colors: number[]): boolean {
  const supply: [number, number] = [0, 0]
  let anyFrozen = false
  for (let index = 0; index < cells.length; index++) {
    const useless = ctx.board.goalColor[cells[index]!] !== colors[index] && frozenAt(ctx.phys, cells[index]!)
    if (useless) anyFrozen = true
    else if (ctx.check.alive[colors[index]!]![cells[index]!] === 1) supply[colors[index]!]!++
  }
  if (!anyFrozen) return false
  return supply[0] < ctx.check.goalsByColor[0] || supply[1] < ctx.check.goalsByColor[1]
}

export function countsAsTrap(ctx: TrapContext, proof: TrapProof, cell: number, color: number): boolean {
  if (proof !== 'deadSquare') return true
  if (specificDeadness(ctx, cell, color)) return true
  return !visibleDeadEnd(ctx, cell)
}

function specificDeadness(ctx: TrapContext, cell: number, color: number): boolean {
  return ctx.alive[1 - color]![cell] === 1 || ctx.flatAlive[color]![cell] === 1
}

function visibleDeadEnd(ctx: TrapContext, cell: number): boolean {
  const blocked = ctx.phys.deltas.map((delta) => {
    const next = advance(ctx.phys, cell, delta)
    return next < 0 || !holdable(ctx.phys, next)
  })
  const open = blocked.filter((value) => !value).length
  const horizontal = blocked[0] || blocked[1]
  const vertical = blocked[2] || blocked[3]
  return open < 2 || (horizontal && vertical)!
}

export function isWallHug(ctx: TrapContext, proof: TrapProof, cell: number, color: number): boolean {
  if (proof !== 'deadSquare' || specificDeadness(ctx, cell, color)) return false
  for (const delta of ctx.phys.deltas) {
    const side = advance(ctx.phys, cell, delta)
    if (side >= 0 && holdable(ctx.phys, side)) continue
    if (!goalAlongWall(ctx, cell, delta, color)) return true
  }
  return false
}

function goalAlongWall(ctx: TrapContext, cell: number, blocked: number, color: number): boolean {
  const along = Math.abs(blocked) === 1 ? ctx.phys.w : 1
  return [along, -along].some((step) => goalAlongRun(ctx, cell, blocked, color, step))
}

function goalAlongRun(ctx: TrapContext, cell: number, blocked: number, color: number, step: number): boolean {
  let at = cell
  for (;;) {
    if (ctx.board.goalColor[at] === color) return true
    const next = advance(ctx.phys, at, step)
    if (next < 0 || !holdable(ctx.phys, next)) return false
    const side = advance(ctx.phys, next, blocked)
    if (side >= 0 && holdable(ctx.phys, side)) return false
    at = next
  }
}

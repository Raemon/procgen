import { HEIGHT, colorIndex } from '../types'
import { cellOf, makeBoard, type Board, type BoardCrate } from './board'
import { PUSH_STRIDE, createPhysics, flood, holdable, pushesFrom, stampCrateCells, type BoardPhysics } from './physics'
import { colorDistance } from './deadSquares'
import { solveBoard, type PushEvent } from './solver'
import type { PuzzleDraft } from './draft'
import { startStateOf, temptingTraps } from './traps/temptingTraps'
import { moveCrate, type CrateState } from './traps/lostProofs'
import type { TemptingTrap } from './traps/trapCollector'

export interface SolutionMetrics {
  boxLines: number
  crateSwitches: number
  colorSwitches: number
  retreats: number
  climbs: number
  drops: number
  dependencies: number
  nearMisses: number
  congestion: number
}

const DEPENDENCY_BUDGET = 2000

export function solutionMetrics(
  board: Board,
  draft: PuzzleDraft,
  pushPath: PushEvent[],
  known?: TemptingTrap[],
): SolutionMetrics {
  return {
    ...walkThePushPath(board, draft, pushPath),
    dependencies: countDependencies(board, draft),
    nearMisses: countNearMisses(board, draft, pushPath, known ?? temptingTraps(board, draft, pushPath)),
    congestion: countCongestion(board, draft),
  }
}

function walkThePushPath(board: Board, draft: PuzzleDraft, pushPath: PushEvent[]) {
  const phys = createPhysics(board)
  const distance = colorDistance(board, phys)
  const colors = draft.crates.map((crate) => colorIndex(crate.color))
  const crateAt = new Map<number, number>()
  draft.crates.forEach((crate, index) => crateAt.set(crate.cell, index))

  const tally = { boxLines: 0, crateSwitches: 0, colorSwitches: 0, retreats: 0, climbs: 0, drops: 0 }
  let previousCrate = -1
  let previousDirection = 0
  let previousStanding = cellOf(board, draft.player)

  for (const event of pushPath) {
    const index = crateAt.get(event.from) ?? -1
    crateAt.delete(event.from)
    crateAt.set(event.to, index)
    const direction = event.to - event.from
    if (index !== previousCrate || direction !== previousDirection) tally.boxLines++
    if (previousCrate !== -1 && index !== previousCrate) {
      tally.crateSwitches++
      if (colors[index] !== colors[previousCrate]) tally.colorSwitches++
    }
    if (phys.terrain[event.standing]! > phys.terrain[previousStanding]!) tally.climbs++
    if (event.fell) tally.drops++
    if (distance[colors[index]!]![event.to]! > distance[colors[index]!]![event.from]!) tally.retreats++
    previousCrate = index
    previousDirection = direction
    previousStanding = event.standing
  }
  return tally
}

export function heightWork(board: Board, draft: PuzzleDraft, pushPath: PushEvent[]): { climbs: number; drops: number } {
  const phys = createPhysics(board)
  let climbs = 0
  let drops = 0
  let previousStanding = cellOf(board, draft.player)
  for (const event of pushPath) {
    if (phys.terrain[event.standing]! > phys.terrain[previousStanding]!) climbs++
    if (event.fell) drops++
    previousStanding = event.standing
  }
  return { climbs, drops }
}

export function countDependencies(board: Board, draft: PuzzleDraft): number {
  const player = cellOf(board, draft.player)
  let count = 0
  for (let index = 0; index < draft.crates.length; index++) {
    if (isDependent(board, draft.crates, player, index)) count++
  }
  return count
}

function isDependent(board: Board, crates: BoardCrate[], player: number, index: number): boolean {
  const crate = crates[index]
  const height = Int32Array.from(board.height)
  for (const [other, blocker] of crates.entries()) if (other !== index) height[blocker.cell] = HEIGHT.Wall + 1
  for (const goal of board.goals) {
    if (goal.color !== crate!.color) continue
    const cell = cellOf(board, goal)
    if (height[cell]! > HEIGHT.Ledge) continue
    const solo = makeBoard(board.w, board.h, height, [goal])
    if (solveBoard(solo, [crate!], player, DEPENDENCY_BUDGET).verdict === 'solved') return false
  }
  return true
}

function countNearMisses(board: Board, draft: PuzzleDraft, path: PushEvent[], traps: TemptingTrap[]): number {
  const phys = createPhysics(board)
  const buffer = new Int32Array(4 * PUSH_STRIDE)
  const mouths = new Set(traps.map((trap) => `${trap.from}->${trap.to}`))
  let state = startStateOf(board, draft)
  let count = 0
  for (const event of [null, ...path]) {
    if (event) {
      const index = state.cells.indexOf(event.from)
      if (index < 0) break
      state = moveCrate(state, index, event.to)
    }
    if (anyPushIsATrap(phys, state, buffer, mouths)) count++
  }
  return count
}

function anyPushIsATrap(phys: BoardPhysics, state: CrateState, buffer: Int32Array, mouths: Set<string>): boolean {
  stampCrateCells(phys, state.cells, state.colors)
  const reach = flood(phys, state.player, 0)
  return state.cells.some((cell) => {
    const options = pushesFrom(phys, cell, reach.words, buffer)
    for (let option = 0; option < options; option++) {
      if (mouths.has(`${cell}->${buffer[option * PUSH_STRIDE]}`)) return true
    }
    return false
  })
}

export function countCongestion(board: Board, draft: PuzzleDraft): number {
  const phys = createPhysics(board)
  const distance = colorDistance(board, phys)
  let total = 0
  for (const crate of draft.crates) {
    const target = nearestGoalOf(board, distance, crate)
    if (target >= 0) total += boxTraffic(board, phys, draft, crate.cell, target)
  }
  return total
}

function nearestGoalOf(board: Board, distance: ReturnType<typeof colorDistance>, crate: BoardCrate): number {
  const color = colorIndex(crate.color)
  let target = -1
  for (const goal of board.goals) {
    const cell = cellOf(board, goal)
    if (goal.color !== crate.color) continue
    if (target < 0 || distance[color]![cell]! < distance[color]![target]!) target = cell
  }
  return target
}

function boxTraffic(board: Board, phys: BoardPhysics, draft: PuzzleDraft, from: number, to: number): number {
  const occupied = new Set(draft.crates.map((crate) => crate.cell))
  const lowX = Math.min(from % board.w, to % board.w)
  const highX = Math.max(from % board.w, to % board.w)
  const lowY = Math.min(Math.floor(from / board.w), Math.floor(to / board.w))
  const highY = Math.max(Math.floor(from / board.w), Math.floor(to / board.w))
  let count = 0
  for (let y = lowY; y <= highY; y++) {
    for (let x = lowX; x <= highX; x++) count += cellTraffic(board, phys, occupied, y * board.w + x)
  }
  return count
}

function cellTraffic(board: Board, phys: BoardPhysics, occupied: Set<number>, cell: number): number {
  const crate = occupied.has(cell) ? 1 : 0
  const goal = board.goalColor[cell]! >= 0 ? 1 : 0
  const obstacle = !holdable(phys, cell) || phys.terrain[cell] === HEIGHT.Ledge ? 1 : 0
  return crate + goal + obstacle
}

export function difficultyScore(metrics: SolutionMetrics, traps: TemptingTrap[], credit = traps.length): number {
  const families = new Set(traps.map((trap) => trap.kind)).size
  return (
    1.0 * credit +
    0.8 * metrics.dependencies +
    0.6 * Math.max(families - 1, 0) +
    0.5 * metrics.climbs +
    0.5 * metrics.drops +
    0.4 * metrics.retreats +
    0.3 * metrics.colorSwitches +
    0.15 * metrics.boxLines +
    0.1 * metrics.nearMisses
  )
}

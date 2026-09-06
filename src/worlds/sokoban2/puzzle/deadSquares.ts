import { HEIGHT, colorIndex } from '../types'
import type { Board, BoardCrate } from './board'
import {
  advance,
  createPhysics,
  crateCells,
  crateColors,
  hasCrate,
  holdable,
  inFlood,
  stampCrates,
  type BoardPhysics,
  type FloodResult,
} from './physics'

export type AliveByColor = [Uint8Array, Uint8Array]
export type DistanceByColor = [Int32Array, Int32Array]

export const UNREACHED = 1 << 20

const COLOR_COUNT = 2

export function reversePushReach(phys: BoardPhysics, seeds: Iterable<number>): Uint8Array {
  const marked = new Uint8Array(phys.size)
  const queue: number[] = []
  for (const seed of seeds) {
    if (seed < 0 || !holdable(phys, seed) || marked[seed] === 1) continue
    marked[seed] = 1
    queue.push(seed)
  }
  for (let head = 0; head < queue.length; head++) {
    const ahead = queue[head]
    for (const delta of phys.deltas) {
      const from = advance(phys, ahead!, -delta)
      if (from < 0 || marked[from] === 1 || !holdable(phys, from)) continue
      if (phys.terrain[ahead!]! > phys.terrain[from]!) continue
      const foothold = advance(phys, from, -delta)
      if (foothold < 0 || phys.terrain[foothold] !== phys.terrain[from]) continue
      marked[from] = 1
      queue.push(from)
    }
  }
  return marked
}

export function aliveByColor(board: Board, phys = createPhysics(board)): AliveByColor {
  const seeds: number[][] = [[], []]
  for (const goal of board.goals) seeds[colorIndex(goal.color)]!.push(goal.y * board.w + goal.x)
  return [reversePushReach(phys, seeds[0]!), reversePushReach(phys, seeds[1]!)]
}

export function colorDistance(board: Board, phys = createPhysics(board)): DistanceByColor {
  const fields: Int32Array[] = []
  for (let color = 0; color < COLOR_COUNT; color++) {
    const distance = new Int32Array(phys.size).fill(UNREACHED)
    const queue: number[] = []
    for (const goal of board.goals) {
      if (colorIndex(goal.color) !== color) continue
      const cell = goal.y * board.w + goal.x
      if (!holdable(phys, cell) || distance[cell] === 0) continue
      distance[cell] = 0
      queue.push(cell)
    }
    for (let head = 0; head < queue.length; head++) {
      const cell = queue[head]
      for (const delta of phys.deltas) {
        const next = advance(phys, cell!, delta)
        if (next < 0 || !holdable(phys, next) || distance[next] !== UNREACHED) continue
        distance[next] = distance[cell!]! + 1
        queue.push(next)
      }
    }
    fields.push(distance)
  }
  return [fields[0]!, fields[1]!]
}

export interface LedgeComponent {
  id: number
  cells: number[]
  member: Uint8Array
}

export function ledgeComponents(board: Board, phys = createPhysics(board)): LedgeComponent[] {
  const seen = new Uint8Array(phys.size)
  const groups: LedgeComponent[] = []
  for (let start = 0; start < phys.size; start++) {
    if (seen[start] === 1 || phys.terrain[start] !== HEIGHT.Ledge) continue
    const member = new Uint8Array(phys.size)
    const cells: number[] = [start]
    seen[start] = 1
    member[start] = 1
    for (let head = 0; head < cells.length; head++) {
      for (const delta of phys.deltas) {
        const next = advance(phys, cells[head]!, delta)
        if (next < 0 || seen[next] === 1 || phys.terrain[next] !== HEIGHT.Ledge) continue
        seen[next] = 1
        member[next] = 1
        cells.push(next)
      }
    }
    groups.push({ id: groups.length, cells, member })
  }
  return groups
}

export function potentialStairs(board: Board, component: LedgeComponent, phys = createPhysics(board)): number[] {
  const stairs: number[] = []
  for (let cell = 0; cell < phys.size; cell++) {
    if (phys.terrain[cell] !== HEIGHT.Floor) continue
    let touchesLedge = false
    let hasApproach = false
    for (const delta of phys.deltas) {
      const next = advance(phys, cell, delta)
      if (next < 0) continue
      if (component.member[next] === 1) touchesLedge = true
      if (phys.terrain[next] === HEIGHT.Floor) hasApproach = true
    }
    if (touchesLedge && hasApproach) stairs.push(cell)
  }
  return stairs
}

export function stairReach(board: Board, component: LedgeComponent, phys = createPhysics(board)): Uint8Array {
  return reversePushReach(phys, potentialStairs(board, component, phys))
}

export interface LedgeAnalysis {
  component: LedgeComponent
  stairs: number[]
  reach: Uint8Array
}

export function ledgeAnalyses(board: Board, phys = createPhysics(board)): LedgeAnalysis[] {
  return ledgeComponents(board, phys).map((component) => ({
    component,
    stairs: potentialStairs(board, component, phys),
    reach: stairReach(board, component, phys),
  }))
}

export function unreachableLedge(analysis: LedgeAnalysis, cells: ArrayLike<number>, reach: FloodResult): boolean {
  for (const cell of analysis.component.cells) if (inFlood(reach, cell)) return false
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    if (analysis.component.member[cell!] === 1) continue
    if (analysis.reach[cell!] === 1) return false
  }
  return true
}

export function frozenAt(phys: BoardPhysics, cell: number, visiting: Set<number> = new Set()): boolean {
  if (visiting.has(cell)) return true
  visiting.add(cell)
  const stuck = axisStuck(phys, cell, 1, visiting) && axisStuck(phys, cell, phys.w, visiting)
  visiting.delete(cell)
  return stuck
}

function axisStuck(phys: BoardPhysics, cell: number, delta: number, visiting: Set<number>): boolean {
  return pushBlocked(phys, cell, delta, visiting) && pushBlocked(phys, cell, -delta, visiting)
}

function pushBlocked(phys: BoardPhysics, cell: number, delta: number, visiting: Set<number>): boolean {
  const height = phys.terrain[cell]
  const landing = advance(phys, cell, delta)
  if (landing < 0 || phys.terrain[landing]! > height!) return true
  if (hasCrate(phys, landing) && frozenAt(phys, landing, visiting)) return true
  const foothold = advance(phys, cell, -delta)
  if (foothold < 0 || phys.terrain[foothold] !== height) return true
  return hasCrate(phys, foothold) && frozenAt(phys, foothold, visiting)
}

export function frozen(board: Board, crates: BoardCrate[], cell: number): boolean {
  const phys = createPhysics(board)
  stampCrates(phys, crates)
  return hasCrate(phys, cell) && frozenAt(phys, cell)
}

export interface LossCheck {
  board: Board
  alive: AliveByColor
  ledges: LedgeAnalysis[]
  goalsByColor: [number, number]
}

export function makeLossCheck(board: Board, phys = createPhysics(board)): LossCheck {
  const goalsByColor: [number, number] = [0, 0]
  for (const goal of board.goals) goalsByColor[colorIndex(goal.color)]!++
  return { board, alive: aliveByColor(board, phys), ledges: ledgeAnalyses(board, phys), goalsByColor }
}

export function cellsLost(
  check: LossCheck,
  cells: ArrayLike<number>,
  colors: ArrayLike<number>,
  reach?: FloodResult,
): boolean {
  const goalColor = check.board.goalColor
  const supply: [number, number] = [0, 0]
  const stranded = new Set<number>()

  for (const analysis of check.ledges) {
    const onLedge: [number, number] = [0, 0]
    const goalsOnLedge: [number, number] = [0, 0]
    for (const cell of analysis.component.cells) if (goalColor[cell]! >= 0) goalsOnLedge[goalColor[cell]!]!++
    for (let i = 0; i < cells.length; i++) if (analysis.component.member[cells[i]!] === 1) onLedge[colors[i]!]!++
    for (let color = 0; color < COLOR_COUNT; color++) if (goalsOnLedge[color]! > onLedge[color]!) return true
    if (!reach || !unreachableLedge(analysis, cells, reach)) continue
    for (const cell of analysis.component.cells) {
      if (goalColor[cell]! < 0) continue
      if (!holdsColor(cells, colors, cell, goalColor[cell]!)) return true
    }
    for (let i = 0; i < cells.length; i++) {
      if (analysis.component.member[cells[i]!] === 1 && goalColor[cells[i]!] !== colors[i]) stranded.add(i)
    }
  }

  for (let i = 0; i < cells.length; i++) {
    if (stranded.has(i)) continue
    if (check.alive[colors[i]!]![cells[i]!] === 1) supply[colors[i]!]!++
  }
  return supply[0] < check.goalsByColor[0] || supply[1] < check.goalsByColor[1]
}

function holdsColor(cells: ArrayLike<number>, colors: ArrayLike<number>, cell: number, color: number): boolean {
  for (let i = 0; i < cells.length; i++) if (cells[i] === cell && colors[i] === color) return true
  return false
}

export function lost(board: Board, crates: BoardCrate[], alive?: AliveByColor, reach?: FloodResult): boolean {
  const check = makeLossCheck(board)
  if (alive) check.alive = alive
  return cellsLost(check, crateCells(crates), crateColors(crates), reach)
}

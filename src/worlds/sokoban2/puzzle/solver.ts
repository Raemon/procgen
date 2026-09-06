import { colorIndex, type CrateColor, type Goal, type Vec } from '../types'
import { cellOf, makeBoard, type Board, type BoardCrate } from './board'
import {
  PUSH_STRIDE,
  colorName,
  createPhysics,
  flood,
  pushesFrom,
  stampCrateCells,
  type BoardPhysics,
} from './physics'
import { cellsLost, frozenAt, makeLossCheck, type LossCheck } from './deadSquares'
import {
  aliveCounts,
  colorGroups,
  countSatisfied,
  matches,
  replaceInGroup,
  signature,
  tracePath,
  type Trail,
} from './searchState'

export interface PushEvent {
  from: number
  to: number

  standing: number
  color: number

  fell: boolean
}

export interface SolveReport {
  verdict: 'solved' | 'provablyUnsolvable' | 'outOfBudget'
  pushes: number | null
  pushPath: PushEvent[] | null
  nodesUsed: number
}

export interface SolveOptions {
  nodeBudget?: number

  playerKey?: 'reach' | 'minCell'
}

interface SearchNode {
  cells: number[]
  player: number
  satisfied: number
  alive: [number, number]
  signature: string

  reach: Uint32Array
}

const DEFAULT_BUDGET = 40000

let ledger = 0

export function nodesSpent(): number {
  return ledger
}

export function solveBoard(
  board: Board,
  crates: BoardCrate[],
  player: Vec | number,
  options: SolveOptions | number = {},
): SolveReport {
  const settings = typeof options === 'number' ? { nodeBudget: options } : options
  const report = search(board, crates, typeof player === 'number' ? player : cellOf(board, player), settings)
  ledger += report.nodesUsed
  return report
}

export function solveBoardColorBlind(
  board: Board,
  crates: BoardCrate[],
  player: Vec | number,
  options: SolveOptions | number = {},
): SolveReport {
  const goals: Goal[] = board.goals.map((goal) => ({ x: goal.x, y: goal.y, color: 'red' as CrateColor }))
  const blind = makeBoard(board.w, board.h, board.height, goals)
  return solveBoard(blind, crates.map((crate) => ({ cell: crate.cell, color: 'red' as CrateColor })), player, options)
}

interface Search {
  board: Board
  phys: BoardPhysics
  check: LossCheck
  colors: Int8Array
  groups: [[number, number], [number, number]]
  byReach: boolean
  pushBuffer: Int32Array
  cameFrom: Map<string, Trail | null>

  seen: Set<string>
}

function search(board: Board, crates: BoardCrate[], playerCell: number, options: SolveOptions): SolveReport {
  const budget = options.nodeBudget ?? DEFAULT_BUDGET
  const phys = createPhysics(board)
  const order = [...crates].sort((a, b) => colorIndex(a.color) - colorIndex(b.color) || a.cell - b.cell)
  const colors = Int8Array.from(order.map((crate) => colorIndex(crate.color)))
  const check = makeLossCheck(board, phys)
  const ctx: Search = {
    board,
    phys,
    check,
    colors,
    groups: colorGroups(colors),
    byReach: options.playerKey !== 'minCell',
    pushBuffer: new Int32Array(4 * PUSH_STRIDE),
    cameFrom: new Map<string, Trail | null>(),
    seen: new Set<string>(),
  }

  const cells = order.map((crate) => crate.cell)
  const satisfied = countSatisfied(board, cells, colors)
  if (satisfied === board.goals.length) return { verdict: 'solved', pushes: 0, pushPath: [], nodesUsed: 0 }

  stampCrateCells(phys, cells, colors)
  const reach = flood(phys, playerCell, 0)
  if (cellsLost(check, cells, colors, reach)) {
    return { verdict: 'provablyUnsolvable', pushes: null, pushPath: null, nodesUsed: 0 }
  }

  const signatureOf = signature(cells, reach, ctx.byReach)
  ctx.cameFrom.set(signatureOf, null)
  let frontier: SearchNode[] = [
    {
      cells,
      player: playerCell,
      satisfied,
      alive: aliveCounts(check.alive, cells, colors),
      signature: signatureOf,
      reach: Uint32Array.from(reach.words),
    },
  ]
  let pushes = 0
  let nodes = 0

  while (frontier.length > 0) {
    pushes++
    const next: SearchNode[] = []
    for (const node of frontier) {
      if (++nodes > budget) return { verdict: 'outOfBudget', pushes: null, pushPath: null, nodesUsed: nodes }
      const win = expandNode(ctx, node, next)
      if (win) {
        return { verdict: 'solved', pushes, pushPath: tracePath(ctx.cameFrom, node.signature, win), nodesUsed: nodes }
      }
    }
    frontier = next
  }
  return { verdict: 'provablyUnsolvable', pushes: null, pushPath: null, nodesUsed: nodes }
}

function expandNode(ctx: Search, node: SearchNode, next: SearchNode[]): PushEvent | null {
  const { board, phys, check, colors } = ctx
  stampCrateCells(phys, node.cells, colors)
  const reach = node.reach

  for (let index = 0; index < node.cells.length; index++) {
    const from = node.cells[index]
    const color = colors[index]
    const options = pushesFrom(phys, from!, reach, ctx.pushBuffer)
    for (let option = 0; option < options; option++) {
      const to = ctx.pushBuffer[option * PUSH_STRIDE]
      const event: PushEvent = {
        from: from!,
        to: to!,
        standing: ctx.pushBuffer[option * PUSH_STRIDE + 1]!,
        color: color!,
        fell: ctx.pushBuffer[option * PUSH_STRIDE + 2] === 1,
      }
      const satisfied = node.satisfied - matches(board, from!, color!) + matches(board, to!, color!)
      if (satisfied === board.goals.length) return event

      const alive: [number, number] = [node.alive[0], node.alive[1]]
      alive[color!]! += check.alive[color!]![to!]! - check.alive[color!]![from!]!
      if (alive[color!]! < check.goalsByColor[color!]!) continue

      const cells = replaceInGroup(node.cells, ctx.groups[color!]!, from!, to!)
      const layout = String.fromCharCode(...cells, from!)
      if (ctx.seen.has(layout)) continue
      ctx.seen.add(layout)
      const surplus = alive[color!]! > check.goalsByColor[color!]! || check.alive[color!]![to!] === 0
      const successor = successorSignature(ctx, cells, from!, to!, color!, surplus)
      stampCrateCells(phys, node.cells, colors)
      if (!successor || ctx.cameFrom.has(successor.signature)) continue
      ctx.cameFrom.set(successor.signature, { parent: node.signature, event })
      next.push({ cells, player: from!, satisfied, alive, ...successor })
    }
  }
  return null
}

function successorSignature(
  ctx: Search,
  cells: number[],
  player: number,
  moved: number,
  color: number,
  surplus: boolean,
): { signature: string; reach: Uint32Array } | null {
  stampCrateCells(ctx.phys, cells, ctx.colors)
  if (!surplus && ctx.board.goalColor[moved] !== color && frozenAt(ctx.phys, moved)) return null
  const reach = flood(ctx.phys, player, 1)
  if (cellsLost(ctx.check, cells, ctx.colors, reach)) return null
  return { signature: signature(cells, reach, ctx.byReach), reach: Uint32Array.from(reach.words) }
}

export function boardCrates(cells: number[], colors: ArrayLike<number>): BoardCrate[] {
  return cells.map((cell, index) => ({ cell, color: colorName(colors[index]!) }))
}

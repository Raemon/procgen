import { HEIGHT } from '../../types'
import { PUSH_STRIDE, advance, flood, pushLands, pushesFrom, stampCrateCells } from '../physics'
import { UNREACHED } from '../deadSquares'
import type { PushEvent } from '../solver'
import { markWinnable, moveCrate, type CrateState, type TrapContext, type TrapKind } from './lostProofs'
import type { TrapCollector } from './trapCollector'

const TRAP_STATES = 600

export function collectOvershoots(ctx: TrapContext, start: CrateState, path: PushEvent[], collector: TrapCollector): void {
  let state = start
  for (const [step, event] of path.entries()) {
    const index = state.cells.indexOf(event.from)
    if (index < 0) return
    state = moveCrate(state, index, event.to)
    markWinnable(ctx, state)
    claimOneMoreShove(ctx, state, index, event, step, collector)
    if (collector.full) return
  }
}

function claimOneMoreShove(
  ctx: TrapContext,
  state: CrateState,
  index: number,
  event: PushEvent,
  step: number,
  collector: TrapCollector,
): void {
  const color = state.colors[index]
  if (ctx.board.goalColor[event.to] === color) return
  if (ctx.phys.terrain[event.from] !== ctx.phys.terrain[event.to]) return
  stampCrateCells(ctx.phys, state.cells, state.colors)
  const beyond = advance(ctx.phys, event.to, event.to - event.from)
  if (!pushLands(ctx.phys, event.to, beyond)) return
  collector.claim('overshoot', event.to, beyond, step + 2, color!, state, moveCrate(state, index, beyond))
}

export function collectLedgePushes(ctx: TrapContext, start: CrateState, path: PushEvent[], collector: TrapCollector): void {
  if (ctx.ledges.length === 0) return
  let state = start
  for (let step = 0; step <= path.length && !collector.full; step++) {
    claimLedgePushes(ctx, state, step + 1, collector)
    const event = path[step]
    if (!event) return
    const index = state.cells.indexOf(event.from)
    if (index < 0) return
    state = moveCrate(state, index, event.to)
    markWinnable(ctx, state)
  }
}

function claimLedgePushes(ctx: TrapContext, state: CrateState, depth: number, collector: TrapCollector): void {
  stampCrateCells(ctx.phys, state.cells, state.colors)
  const reach = flood(ctx.phys, state.player, 0)
  for (let index = 0; index < state.cells.length; index++) {
    const from = state.cells[index]
    if (ctx.phys.terrain[from!] !== HEIGHT.Ledge) continue
    const options = pushesFrom(ctx.phys, from!, reach.words, ctx.buffer)
    for (let option = 0; option < options; option++) {
      const to = ctx.buffer[option * PUSH_STRIDE]
      collector.claim('wrongEdgeDrop', from!, to!, depth, state.colors[index]!, state, moveCrate(state, index, to!))
      if (collector.full) return
      stampCrateCells(ctx.phys, state.cells, state.colors)
    }
  }
}

function classify(ctx: TrapContext, state: CrateState, index: number, to: number): TrapKind | null {
  const from = state.cells[index]
  const color = state.colors[index]
  if (ctx.phys.terrain[from!] === HEIGHT.Ledge) return 'wrongEdgeDrop'
  const goalWard = ctx.own[color!]![to]! < ctx.own[color!]![from!]!
  const blindWard = ctx.blind[to]! < ctx.blind[from!]! && ctx.blind[to] !== UNREACHED
  const wrongGoal = ctx.board.goalColor[to]! >= 0 && ctx.board.goalColor[to] !== color
  if (!goalWard && !blindWard && !wrongGoal) return null
  if (wrongGoal || (ctx.alive[color!]![to] === 0 && ctx.alive[1 - color!]![to] === 1)) return 'colorMismatch'
  return 'greedy'
}

interface Candidate {
  index: number
  to: number
  kind: TrapKind
}

function temptingPushes(ctx: TrapContext, state: CrateState): Candidate[] {
  stampCrateCells(ctx.phys, state.cells, state.colors)
  const reach = flood(ctx.phys, state.player, 0)
  const out: Candidate[] = []
  for (let index = 0; index < state.cells.length; index++) {
    const options = pushesFrom(ctx.phys, state.cells[index]!, reach.words, ctx.buffer)
    for (let option = 0; option < options; option++) {
      const to = ctx.buffer[option * PUSH_STRIDE]
      const kind = classify(ctx, state, index, to!)
      if (kind) out.push({ index, to: to!, kind })
    }
  }
  return out
}

export function collectGreedy(ctx: TrapContext, start: CrateState, maxDepth: number, collector: TrapCollector): void {
  let frontier = [start]
  const seen = new Set<string>()
  const meter = { states: 0 }
  for (let depth = 1; depth <= maxDepth && frontier.length > 0 && !collector.full; depth++) {
    const next: CrateState[] = []
    for (const node of frontier) {
      if (++meter.states > TRAP_STATES) return
      if (!expandTemptingPushes(ctx, node, depth, seen, next, collector)) return
    }
    frontier = next
  }
}

function expandTemptingPushes(
  ctx: TrapContext,
  node: CrateState,
  depth: number,
  seen: Set<string>,
  next: CrateState[],
  collector: TrapCollector,
): boolean {
  for (const candidate of temptingPushes(ctx, node)) {
    const from = node.cells[candidate.index]
    const moved = moveCrate(node, candidate.index, candidate.to)
    const color = node.colors[candidate.index]
    const verdict = collector.claim(candidate.kind, from!, candidate.to, depth, color!, node, moved)
    if (collector.full) return false
    if (verdict !== 'alive') continue
    const signature = `${moved.cells.join(',')}|${moved.player}`
    if (seen.has(signature)) continue
    seen.add(signature)
    next.push(moved)
  }
  return true
}

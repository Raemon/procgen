import {
  advance,
  backFlood,
  flood,
  hasCrate,
  holdable,
  inFlood,
  stampCrateCells,
} from '../physics'
import type { Reverse, ReverseState } from './reverseRun'

export interface Pull {
  index: number
  delta: number
  from: number
  to: number
  player: number
}

const BFS_NODES = 1200

export function pullCandidates(rev: Reverse, state: ReverseState): Pull[] {
  stampCrateCells(rev.phys, state.cells, rev.colors)
  const back = backFlood(rev.phys, state.player, 1)
  const pulls: Pull[] = []
  for (let index = 0; index < state.cells.length; index++) {
    for (const delta of rev.phys.deltas) {
      const pull = pullInDirection(rev, state, index, delta)
      if (pull && inFlood(back, pull.to)) pulls.push(pull)
    }
  }
  return pulls
}

function pullInDirection(rev: Reverse, state: ReverseState, index: number, delta: number): Pull | null {
  const { phys } = rev
  const from = state.cells[index]
  const to = advance(phys, from!, -delta)
  if (to < 0 || !holdable(phys, to)) return null
  const player = advance(phys, to, -delta)
  if (player < 0) return null
  if (phys.terrain[to]! < phys.terrain[from!]!) return null
  if (phys.terrain[player] !== phys.terrain[to]) return null
  if (hasCrate(phys, to) || hasCrate(phys, player)) return null
  return { index, delta, from: from!, to, player }
}

export function applyPull(state: ReverseState, pull: Pull): ReverseState {
  const cells = state.cells.slice()
  cells[pull.index] = pull.to
  return { cells, player: pull.player, pulls: state.pulls + 1 }
}

export function last(history: ReverseState[]): ReverseState {
  return history[history.length - 1]!
}

export function startCell(rev: Reverse, cells: number[], entries: number[]): number | null {
  stampCrateCells(rev.phys, cells, rev.colors)
  const free = (cell: number) => holdable(rev.phys, cell) && !hasCrate(rev.phys, cell)
  const open = rev.rng.shuffle(entries.filter(free))
  if (open.length > 0) return open[0]!
  const spots = rev.rng.shuffle(Array.from({ length: rev.phys.size }, (_, cell) => cell).filter(free))
  if (entries.length === 0) return spots[0] ?? null
  return spots.find((cell) => reachesAnEntry(rev, cell, entries)) ?? null
}

function reachesAnEntry(rev: Reverse, cell: number, entries: number[]): boolean {
  const reach = flood(rev.phys, cell, 0)
  return entries.some((entry) => inFlood(reach, entry))
}

interface PathNode {
  state: ReverseState
  depth: number
  parent: number
  pull: Pull | null
}

export function pullPath(
  rev: Reverse,
  from: ReverseState,
  index: number,
  accept: (cell: number) => boolean,
  maxSteps: number,
  minSteps: number,
): ReverseState[] | null {
  const nodes: PathNode[] = [{ state: from, depth: 0, parent: -1, pull: null }]
  const seen = new Set<string>([`${from.cells[index]},${from.player}`])
  for (let head = 0; head < nodes.length && head < BFS_NODES; head++) {
    const node = nodes[head]
    if (node!.depth >= minSteps && accept(node!.state.cells[index]!)) return replay(nodes, head)
    if (node!.depth < maxSteps) expandPullPath(rev, nodes, seen, head, index)
  }
  return null
}

function expandPullPath(rev: Reverse, nodes: PathNode[], seen: Set<string>, head: number, index: number): void {
  const node = nodes[head]
  for (const pull of pullCandidates(rev, node!.state)) {
    if (pull.index !== index) continue
    const next = applyPull(node!.state, pull)
    const key = `${next.cells[index]},${next.player}`
    if (seen.has(key)) continue
    seen.add(key)
    nodes.push({ state: next, depth: node!.depth + 1, parent: head, pull })
  }
}

function replay(nodes: PathNode[], head: number): ReverseState[] {
  const path: ReverseState[] = []
  for (let cursor = head; cursor > 0; cursor = nodes[cursor]!.parent) path.push(nodes[cursor]!.state)
  return path.reverse()
}

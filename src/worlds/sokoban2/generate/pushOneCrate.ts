import { DIRS, DIR_LIST, HEIGHT, type Crate, type Vec, type World } from '../types'
import { crateFinder, holdsCrates, inBounds, index } from '../world'
import { doorLock } from '../play/doors'
import { moveKind } from '../play/physics'
import { worldReach, type WorldReach } from './worldReach'

export interface WalkPosition {
  player: Vec
}

const PUSH_NODE_BUDGET = 8000

interface PushNode {
  crateCell: number
  at: WalkPosition
}

export function pushOneCrate(
  world: World,
  crates: Crate[],
  from: WalkPosition,
  source: Vec,
  dest: Vec,
  nodeBudget = PUSH_NODE_BUDGET,
): { crates: Crate[]; at: WalkPosition } | null {
  const moving = crates.find((crate) => crate.x === source.x && crate.y === source.y)
  if (!moving) return null
  if (moving.x === dest.x && moving.y === dest.y) return { crates: crates.map((crate) => ({ ...crate })), at: from }
  if (!deliverable(world, crates, moving, dest)) return null
  return searchPushes(world, crates, moving, from, source, dest, nodeBudget)
}

function deliverable(world: World, crates: Crate[], moving: Crate, dest: Vec): boolean {
  if (!holdsCrates(world, dest.x, dest.y)) return false
  return !crates.some((crate) => crate.id !== moving.id && crate.x === dest.x && crate.y === dest.y)
}

function searchPushes(
  world: World,
  crates: Crate[],
  moving: Crate,
  from: WalkPosition,
  source: Vec,
  dest: Vec,
  nodeBudget: number,
): { crates: Crate[]; at: WalkPosition } | null {
  const destId = index(world, dest.x, dest.y)
  const lane = crateLane(world, source, dest)
  const queued = new Set<string>()
  const seen = new Set<string>()
  let frontier: PushNode[] = [{ crateCell: index(world, source.x, source.y), at: from }]
  let nodes = 0

  while (frontier.length > 0) {
    const next: PushNode[] = []
    for (const node of frontier) {
      const reach = worldReach(world, withMovingAt(world, crates, moving.id, node.crateCell), node.at.player)
      const key = `${node.crateCell}|${reach.keyAround(around(world, node.crateCell))}`
      if (seen.has(key)) continue
      seen.add(key)
      if (++nodes > nodeBudget) return null
      for (const move of pushesFrom(world, crates, moving.id, node, reach, lane)) {
        if (move.crateCell === destId) return { crates: movedCrates(crates, moving.id, dest), at: move.at }
        const rough = `${move.crateCell}|${index(world, move.at.player.x, move.at.player.y)}`
        if (queued.has(rough)) continue
        queued.add(rough)
        next.push(move)
      }
    }
    frontier = next
  }
  return null
}

function pushesFrom(
  world: World,
  crates: Crate[],
  movingId: number,
  node: PushNode,
  reach: WorldReach,
  lane: Set<number>,
): PushNode[] {
  const simulated = withMovingAt(world, crates, movingId, node.crateCell)
  const crateAt = crateFinder(simulated)
  const locked = doorLock(world, simulated)
  const crateCell = cellVec(world, node.crateCell)
  const moves: PushNode[] = []
  const found = new Set<number>()

  for (const dir of DIR_LIST) {
    const behind = { x: crateCell.x - DIRS[dir].x, y: crateCell.y - DIRS[dir].y }
    if (!inBounds(world, behind.x, behind.y)) continue
    if (!reach.cells.has(index(world, behind.x, behind.y))) continue
    const outcome = moveKind(world, crateAt, behind, dir, locked)
    if (outcome.kind !== 'push' || outcome.crate.id !== movingId) continue
    const aheadId = index(world, outcome.destination.x, outcome.destination.y)
    if (!lane.has(aheadId) || found.has(aheadId)) continue
    found.add(aheadId)
    moves.push({ crateCell: aheadId, at: { player: crateCell } })
  }
  return moves
}

function crateLane(world: World, from: Vec, dest: Vec): Set<number> {
  const lane = new Set<number>([index(world, from.x, from.y), index(world, dest.x, dest.y)])
  for (const room of world.rooms) {
    for (const cell of room.highway) {
      lane.add(index(world, cell.x, cell.y))
      for (const dir of DIR_LIST) addShoulder(world, lane, { x: cell.x + DIRS[dir].x, y: cell.y + DIRS[dir].y })
    }
  }
  for (const door of world.doors) lane.add(index(world, door.x, door.y))
  return lane
}

function addShoulder(world: World, lane: Set<number>, cell: Vec): void {
  if (!inBounds(world, cell.x, cell.y)) return
  const id = index(world, cell.x, cell.y)
  if (world.roomIds[id]! >= 0 && world.heights[id] === HEIGHT.Floor) lane.add(id)
}

function around(world: World, cell: number): number[] {
  const at = cellVec(world, cell)
  return DIR_LIST.map((dir) => {
    const beside = { x: at.x + DIRS[dir].x, y: at.y + DIRS[dir].y }
    return inBounds(world, beside.x, beside.y) ? index(world, beside.x, beside.y) : -1
  })
}

function withMovingAt(world: World, crates: Crate[], movingId: number, cell: number): Crate[] {
  const where = cellVec(world, cell)
  return crates.map((crate) => (crate.id === movingId ? { ...crate, x: where.x, y: where.y } : crate))
}

function movedCrates(crates: Crate[], movingId: number, dest: Vec): Crate[] {
  return crates.map((crate) => (crate.id === movingId ? { ...crate, x: dest.x, y: dest.y } : { ...crate }))
}

function cellVec(world: World, cell: number): Vec {
  return { x: cell % world.width, y: (cell / world.width) | 0 }
}

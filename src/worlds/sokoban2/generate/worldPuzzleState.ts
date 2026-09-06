import { COLORS, type Crate, type Goal, type RoomPlan, type Vec, type World } from '../types'
import { crateFinder, index, roomAt } from '../world'
import { roomEntries } from './worldReach'
import type { WalkPosition } from './pushOneCrate'

export function startPosition(world: World): WalkPosition {
  return { player: { ...world.start } }
}

export function visitOrder(world: World): RoomPlan[] {
  return [...world.rooms].sort((a, b) => a.depth - b.depth || a.id - b.id)
}

export function localGoals(world: World, roomId: number): Goal[] {
  const imported = new Set(
    world.deliveries.filter((delivery) => delivery.toRoom === roomId).map((delivery) => cellKey(delivery.goal)),
  )
  return world.rooms[roomId]!.goals.filter((goal) => !imported.has(cellKey(goal)))
}

export function teleportLocal(world: World, crates: Crate[], roomId: number): void {
  const goals = localGoals(world, roomId)
  const movable = crates.filter((crate) => roomAt(world, crate.x, crate.y) === roomId && !isDeliveryCrate(world, crate, roomId))
  for (const color of COLORS) {
    const pool = movable.filter((crate) => crate.color === color)
    const targets = goals.filter((goal) => goal.color === color)
    for (let i = 0; i < pool.length && i < targets.length; i++) {
      pool[i]!.x = targets[i]!.x
      pool[i]!.y = targets[i]!.y
    }
  }
}

function isDeliveryCrate(world: World, crate: Crate, roomId: number): boolean {
  return world.deliveries.some(
    (delivery) =>
      (delivery.toRoom === roomId && crate.x === delivery.goal.x && crate.y === delivery.goal.y) ||
      (delivery.fromRoom === roomId && crate.x === delivery.parking.x && crate.y === delivery.parking.y),
  )
}

export function allGoalsFilled(world: World, crates: Crate[]): boolean {
  return world.rooms.every((room) => goalsFilledBy(crates, room.goals))
}

export function goalsFilledBy(crates: Crate[], goals: Goal[]): boolean {
  const crateAt = crateFinder(crates)
  return goals.every((goal) => crateAt(goal.x, goal.y)?.color === goal.color)
}

export function unfinishedRooms(world: World, crates: Crate[]): number[] {
  return world.rooms.filter((room) => !goalsFilledBy(crates, room.goals)).map((room) => room.id)
}

export function reachableCellInRoom(world: World, room: RoomPlan, reach: Set<number>): Vec | null {
  for (const entry of roomEntries(world, room.id)) {
    if (reach.has(index(world, entry.x, entry.y))) return entry
  }
  for (const cell of room.cells) {
    if (reach.has(index(world, cell.x, cell.y))) return { ...cell }
  }
  return null
}

export function overwrite(crates: Crate[], updated: Crate[]): void {
  for (let i = 0; i < crates.length; i++) crates[i]! = updated[i]!
}

export function cellKey(cell: Vec): string {
  return `${cell.x},${cell.y}`
}

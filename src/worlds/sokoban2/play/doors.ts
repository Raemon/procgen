import type { Crate, Door, World } from '../types'
import { inBounds, index } from '../world'
import { roomSolved } from './rooms'

export type LockCheck = (x: number, y: number) => boolean

export const NEVER_LOCKED: LockCheck = () => false

export function doorOpensNow(world: World, door: Door, crates: Crate[]): boolean {
  return door.opensWhen === null || roomSolved(world, crates, door.opensWhen)
}

export function openedDoorsOf(world: World, crates: Crate[], latched: Iterable<number> = []): Set<number> {
  const opened = new Set(latched)
  world.doors.forEach((door, id) => {
    if (doorOpensNow(world, door, crates)) opened.add(id)
  })
  return opened
}

export function closedDoorsAt(world: World, opened: ReadonlySet<number>): LockCheck {
  const closed = new Set<number>()
  world.doors.forEach((door, id) => {
    if (!opened.has(id)) closed.add(index(world, door.x, door.y))
  })
  if (closed.size === 0) return NEVER_LOCKED
  return (x, y) => inBounds(world, x, y) && closed.has(index(world, x, y))
}

export function doorLock(world: World, crates: Crate[], latched: Iterable<number> = []): LockCheck {
  return closedDoorsAt(world, openedDoorsOf(world, crates, latched))
}

export function doorIndexAt(world: World, x: number, y: number): number {
  return world.doors.findIndex((door) => door.x === x && door.y === y)
}

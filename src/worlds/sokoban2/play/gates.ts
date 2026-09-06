import type { Crate, World } from '../types'
import { openedDoorsOf } from './doors'

export interface Gate {
  x: number
  y: number
  door: number
  opensWhen: number | null
  sealed: boolean
}

export function gateKey(gate: Gate): string {
  return `${gate.x},${gate.y}`
}

export function worldGates(world: World, crates: Crate[], latched: Iterable<number> = []): Gate[] {
  const opened = openedDoorsOf(world, crates, latched)
  return world.doors.map((door, id) => ({
    x: door.x,
    y: door.y,
    door: id,
    opensWhen: door.opensWhen,
    sealed: !opened.has(id),
  }))
}

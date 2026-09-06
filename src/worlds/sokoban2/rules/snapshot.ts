import { integers, numberedCells } from '@/features/game/sharedSnapshot'
import { openedDoorsOf } from '../play/doors'
import { crateFinder, inBounds } from '../world'
import { openedDoorsSorted, type DungeonState } from './dungeonState'

export interface Sokoban2Snapshot {
  crates: Array<[number, number, number]>
  opened: number[]
}

export function sanitizeSnapshot(raw: unknown): Sokoban2Snapshot {
  const held = (raw ?? {}) as { crates?: unknown; opened?: unknown }
  return { crates: numberedCells(held.crates), opened: integers(held.opened) }
}

export function describeSokobanState(state: unknown): string {
  const held = sanitizeSnapshot(state)
  return `${held.crates.length} crates moved, ${held.opened.length} doors opened`
}

export function snapshotOf(state: DungeonState): Sokoban2Snapshot {
  const { world } = state
  return {
    crates: state.live
      .filter((crate) => {
        const home = world.crates.find((each) => each.id === crate.id)
        return !home || home.x !== crate.x || home.y !== crate.y
      })
      .map((crate) => [crate.id, crate.x, crate.y]),
    opened: openedDoorsSorted(state),
  }
}

export function applySnapshotTo(state: DungeonState, raw: unknown): void {
  const { world } = state
  const held = sanitizeSnapshot(raw)
  state.live = world.crates.map((crate) => ({ ...crate }))
  for (const [id, x, y] of held.crates) {
    const crate = state.live.find((each) => each.id === id)
    if (crate && inBounds(world, x, y)) {
      crate.x = x
      crate.y = y
    }
  }
  state.crateAt = crateFinder(state.live)
  const latched = held.opened.filter((door) => door >= 0 && door < world.doors.length)
  state.opened = openedDoorsOf(world, state.live, latched)
}

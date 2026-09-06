import { doorIndexAt, openedDoorsOf } from '../play/doors'
import type { CrateAt } from '../play/goals'
import type { Crate, Vec, World } from '../types'
import { crateFinder } from '../world'

export interface DungeonState {
  readonly world: World
  live: Crate[]
  crateAt: CrateAt
  opened: Set<number>
}

export function dungeonStateOf(world: World): DungeonState {
  const live = world.crates.map((crate) => ({ ...crate }))
  return { world, live, crateAt: crateFinder(live), opened: openedDoorsOf(world, live) }
}

export function openedDoorsSorted(state: DungeonState): number[] {
  return [...state.opened].sort((a, b) => a - b)
}

export function doorIsShut(state: DungeonState, cell: Vec): boolean {
  const door = doorIndexAt(state.world, cell.x, cell.y)
  return door >= 0 && !state.opened.has(door)
}

import { doorIndexAt, openedDoorsOf } from '../play/doors'
import type { CrateAt } from '../play/goals'
import type { Crate, Vec, World } from '../types'
import { crateFinder, roomAt } from '../world'

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

export function moveCrateTo(state: DungeonState, crate: Crate, destination: Vec): boolean {
  const pushed = state.live.find((each) => each.id === crate.id)
  if (!pushed) return false
  pushed.x = destination.x
  pushed.y = destination.y
  refindCrates(state)
  state.opened = openedDoorsOf(state.world, state.live, state.opened)
  return true
}

export function sendRoomCratesHome(state: DungeonState, room: number): boolean {
  const strays = state.live.filter((crate) => strayedFromRoom(state.world, crate, room))
  for (const stray of strays) standWhereItStarted(state.world, stray)
  if (strays.length > 0) refindCrates(state)
  return strays.length > 0
}

function strayedFromRoom(world: World, crate: Crate, room: number): boolean {
  const home = startOf(world, crate)
  if (!home || roomAt(world, home.x, home.y) !== room) return false
  return crate.x !== home.x || crate.y !== home.y
}

function standWhereItStarted(world: World, crate: Crate): void {
  const home = startOf(world, crate)!
  crate.x = home.x
  crate.y = home.y
}

function startOf(world: World, crate: Crate): Crate | undefined {
  return world.crates.find((each) => each.id === crate.id)
}

function refindCrates(state: DungeonState): void {
  state.crateAt = crateFinder(state.live)
}

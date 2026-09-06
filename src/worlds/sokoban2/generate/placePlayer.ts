import type { Rng } from '../rng'
import type { Layout } from './layout/buildLayout'
import { HEIGHT, type Vec, type World } from '../types'
import { index } from '../world'
import { reachableCells } from '../play/reach'
import { roomEntries } from './worldReach'

export function placePlayer(world: World, layout: Layout, rng: Rng): Vec {
  const entrance = world.rooms[layout.order[0]!]
  const candidates = rng.shuffle(entrance!.cells.filter((cell) => isOpenFloor(world, cell)))
  const entries = roomEntries(world, entrance!.id)
  return (
    candidates.find((cell) => reachesEntries(world, cell, entries, 'every')) ??
    candidates.find((cell) => reachesEntries(world, cell, entries, 'some')) ??
    candidates[0] ??
    { ...entrance!.cells[0]! }
  )
}

function isOpenFloor(world: World, cell: Vec): boolean {
  const id = index(world, cell.x, cell.y)
  if (world.heights[id] !== HEIGHT.Floor || world.roomIds[id]! < 0) return false
  return !world.crates.some((crate) => crate.x === cell.x && crate.y === cell.y)
}

function reachesEntries(world: World, start: Vec, entries: Vec[], how: 'every' | 'some'): boolean {
  if (entries.length === 0) return true
  const reach = reachableCells(world, world.crates, start)
  const reached = (entry: Vec) => reach.has(index(world, entry.x, entry.y))
  return how === 'every' ? entries.every(reached) : entries.some(reached)
}

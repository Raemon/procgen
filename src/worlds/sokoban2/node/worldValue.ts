import type { Vec, World } from '../types'

export interface SerializedWorld {
  seed: number
  width: number
  height: number
  tiles: number[]
  heights: number[]
  roomIds: number[]
  rooms: World['rooms']
  doors: World['doors']
  start: Vec
  crates: World['crates']
  goals: World['goals']
  deliveries: World['deliveries']
  stats: World['stats']
  trace: string[]
}

export function serializeWorld(world: World): SerializedWorld {
  return {
    seed: world.seed,
    width: world.width,
    height: world.height,
    tiles: Array.from(world.tiles),
    heights: Array.from(world.heights),
    roomIds: Array.from(world.roomIds),
    rooms: world.rooms,
    doors: world.doors,
    start: world.start,
    crates: world.crates,
    goals: world.goals,
    deliveries: world.deliveries,
    stats: world.stats,
    trace: world.trace,
  }
}

export function parseWorld(data: unknown): World {
  const held = data as SerializedWorld
  return {
    seed: held.seed,
    width: held.width,
    height: held.height,
    tiles: Uint8Array.from(held.tiles),
    heights: Uint8Array.from(held.heights),
    roomIds: Int16Array.from(held.roomIds),
    rooms: held.rooms,
    doors: held.doors,
    start: held.start,
    crates: held.crates,
    goals: held.goals,
    deliveries: held.deliveries,
    stats: held.stats,
    trace: held.trace,
  }
}

export function worldOrigin(world: Pick<World, 'width' | 'height'>): Vec {
  return { x: -Math.floor(world.width / 2), y: -Math.floor(world.height / 2) }
}

export function toDungeon(world: Pick<World, 'width' | 'height'>, x: number, y: number): Vec {
  const origin = worldOrigin(world)
  return { x: x - origin.x, y: y - origin.y }
}

export function fromDungeon(world: Pick<World, 'width' | 'height'>, cell: Vec): Vec {
  const origin = worldOrigin(world)
  return { x: cell.x + origin.x, y: cell.y + origin.y }
}

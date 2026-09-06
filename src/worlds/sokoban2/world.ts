import { HEIGHT, IMPASSABLE, TILE, type Crate, type Goal, type Vec, type World } from './types'

export function index(world: { width: number }, x: number, y: number): number {
  return y * world.width + x
}

export function inBounds(world: { width: number; height: number }, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < world.width && y < world.height
}

export function tileAt(world: World, x: number, y: number): number {
  if (!inBounds(world, x, y)) return TILE.Void
  return world.tiles[index(world, x, y)]!
}

export function terrainHeight(world: World, x: number, y: number): number {
  if (!inBounds(world, x, y)) return IMPASSABLE
  const id = index(world, x, y)
  if (world.tiles[id] === TILE.Void) return IMPASSABLE
  return world.heights[id]!
}

export function surfaceHeight(world: World, crateAt: (x: number, y: number) => Crate | undefined, x: number, y: number): number {
  const terrain = terrainHeight(world, x, y)
  if (terrain >= IMPASSABLE) return terrain
  return terrain + (crateAt(x, y) ? 1 : 0)
}

export function roomAt(world: World, x: number, y: number): number {
  if (!inBounds(world, x, y)) return -1
  return world.roomIds[index(world, x, y)]!
}

export function holdsCrates(world: World, x: number, y: number): boolean {
  const terrain = terrainHeight(world, x, y)
  return terrain <= HEIGHT.Ledge
}

export function goalAt(world: World, x: number, y: number): Goal | undefined {
  return world.goals.find((goal) => goal.x === x && goal.y === y)
}

export function key(v: Vec): string {
  return `${v.x},${v.y}`
}

export function toWorld(room: { x: number; y: number }, local: Vec): Vec {
  return { x: room.x + local.x, y: room.y + local.y }
}

export function crateFinder(crates: Crate[]): (x: number, y: number) => Crate | undefined {
  const byCell = new Map<number, Crate>()
  for (const crate of crates) byCell.set(crate.y * 1_000_003 + crate.x, crate)
  return (x, y) => byCell.get(y * 1_000_003 + x)
}

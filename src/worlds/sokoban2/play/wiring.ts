import { HEIGHT, type Goal, type Vec, type World } from '../types'
import { inBounds, roomAt, terrainHeight } from '../world'

export interface RoomWiring {
  room: number
  goals: Goal[]
  doors: number[]
  wires: Vec[]
}

export type WireRouter = (plates: readonly Vec[], doors: readonly Vec[], isFloor: (x: number, y: number) => boolean) => Vec[]

export function wireDungeon(world: World, route: WireRouter): RoomWiring[] {
  const doorsByRoom = new Map<number, number[]>()
  world.doors.forEach((door, id) => {
    if (door.opensWhen === null) return
    doorsByRoom.set(door.opensWhen, [...(doorsByRoom.get(door.opensWhen) ?? []), id])
  })
  const wired: RoomWiring[] = []
  for (const [room, doors] of doorsByRoom) {
    const goals = world.rooms.find((plan) => plan.id === room)?.goals ?? []
    if (goals.length === 0) continue
    const doorCells = doors.map((id) => world.doors[id]!)
    const isFloor = (x: number, y: number) =>
      inBounds(world, x, y) && roomAt(world, x, y) === room && terrainHeight(world, x, y) === HEIGHT.Floor
    wired.push({ room, goals, doors, wires: route(goals, doorCells, isFloor) })
  }
  return wired
}

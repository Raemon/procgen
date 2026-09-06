import type { Crate, RoomPlan, World } from '../types'
import { crateFinder } from '../world'
import { goalSatisfied } from './goals'

function roomPlan(world: World, roomId: number): RoomPlan | undefined {
  if (roomId < 0) return undefined
  const direct = world.rooms[roomId]
  if (direct && direct.id === roomId) return direct
  return world.rooms.find((room) => room.id === roomId)
}

export function roomSolved(world: World, crates: Crate[], roomId: number): boolean {
  const room = roomPlan(world, roomId)
  if (!room || room.goals.length === 0) return true
  const crateAt = crateFinder(crates)
  return room.goals.every((goal) => goalSatisfied(goal, crateAt))
}

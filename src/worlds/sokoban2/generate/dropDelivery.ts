import type { World, WorldDelivery } from '../types'
import { roomAt } from '../world'
import { allGoals } from './paintWorld'

export function dropDelivery(world: World, delivery: WorldDelivery, reason: string): void {
  world.deliveries = world.deliveries.filter((other) => other !== delivery)
  const crateIndex = world.crates.findIndex((crate) => crate.x === delivery.parking.x && crate.y === delivery.parking.y)
  if (crateIndex >= 0) world.crates.splice(crateIndex, 1)
  const importer = world.rooms[delivery.toRoom]
  importer!.goals = importer!.goals.filter((goal) => !(goal.x === delivery.goal.x && goal.y === delivery.goal.y))
  importer!.imports = Math.max(0, importer!.imports - 1)
  importer!.notes = [...importer!.notes, `dropped a delivery: ${reason}`]
  world.rooms[delivery.fromRoom]!.exports = Math.max(0, world.rooms[delivery.fromRoom]!.exports - 1)
  world.goals = allGoals(world.rooms)
}

export function dropDeliveriesTouching(world: World, roomId: number, reason: string): number {
  const touching = world.deliveries.filter((delivery) => delivery.fromRoom === roomId || delivery.toRoom === roomId)
  for (const delivery of touching) {
    dropDelivery(world, delivery, `room ${roomId} was ${reason}`)
  }
  return touching.length
}

export function clearRoomPuzzle(world: World, roomId: number, reason: string): void {
  const room = world.rooms[roomId]
  for (const delivery of world.deliveries.filter((d) => d.fromRoom === roomId || d.toRoom === roomId)) {
    dropDelivery(world, delivery, 'its room was cleared')
  }
  world.crates = world.crates.filter((crate) => roomAt(world, crate.x, crate.y) !== roomId)
  room!.goals = []
  room!.imports = 0
  room!.exports = 0
  room!.pullDepth = 0
  room!.concept = 'empty'
  room!.notes = [...room!.notes, `cleared; ${reason}`]
  world.goals = allGoals(world.rooms)
}

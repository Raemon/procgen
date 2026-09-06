import type { Crate, Goal, World, WorldDelivery } from '../types'
import { playableFromEveryDoor } from './roomAsPlayed'

export function importerLocalStillWorks(world: World, delivery: WorldDelivery, crates: Crate[], alreadyFilled: Goal[]): boolean {
  return playableFromEveryDoor(world, delivery.toRoom, crates, [...alreadyFilled, delivery.goal])
}

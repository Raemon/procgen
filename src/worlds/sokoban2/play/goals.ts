import type { Crate, Goal, World } from '../types'
import { crateFinder } from '../world'

export type CrateAt = (x: number, y: number) => Crate | undefined

export function goalSatisfied(goal: Goal, crateAt: CrateAt): boolean {
  return crateAt(goal.x, goal.y)?.color === goal.color
}

export function goalsFilled(world: World, crates: Crate[]): number {
  const crateAt = crateFinder(crates)
  return world.goals.filter((goal) => goalSatisfied(goal, crateAt)).length
}

export function isSolved(world: World, crates: Crate[]): boolean {
  const crateAt = crateFinder(crates)
  return world.goals.every((goal) => goalSatisfied(goal, crateAt))
}

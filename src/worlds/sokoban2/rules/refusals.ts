import type { Cell } from '@/features/game/worldRules'
import { doorIndexAt } from '../play/doors'
import { CLIMB, HEIGHT, type Dir, type Vec } from '../types'
import { surfaceHeight, terrainHeight } from '../world'
import type { DungeonState } from './dungeonState'

export function whyBlocked(state: DungeonState, from: Vec, to: Vec, at: Cell): string {
  const { world, crateAt } = state
  const here = `(${at.x},${at.y})`
  const door = doorIndexAt(world, to.x, to.y)
  if (door >= 0 && !state.opened.has(door)) {
    const waitsOn = world.doors[door]!.opensWhen
    return `the door at ${here} is shut until room ${waitsOn ?? '?'} is finished`
  }
  if (terrainHeight(world, to.x, to.y) >= HEIGHT.Wall) return `a wall stands at ${here}`
  const crate = crateAt(to.x, to.y)
  if (crate) return `the ${crate.color} crate at ${here} cannot be pushed that way`
  const rise = surfaceHeight(world, crateAt, to.x, to.y) - surfaceHeight(world, crateAt, from.x, from.y)
  if (rise > CLIMB) return `${here} is a ledge ${rise} up; push a crate against it and walk up the crate`
  return `something at ${here} is in the way`
}

export function dirOf(dx: number, dy: number): Dir | null {
  if (dx === 0 && dy === -1) return 'up'
  if (dx === 0 && dy === 1) return 'down'
  if (dx === -1 && dy === 0) return 'left'
  if (dx === 1 && dy === 0) return 'right'
  return null
}

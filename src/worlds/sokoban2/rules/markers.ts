import type { Marker } from '@/features/asset-library/worlds/worldSampler'
import { crateLook } from '../art/crateLook'
import { doorLook } from '../art/doorLook'
import { goalLook } from '../art/goalLook'
import { fromDungeon } from '../node/worldValue'
import { goalSatisfied } from '../play/goals'
import type { Crate, Vec } from '../types'
import type { DungeonState } from './dungeonState'

export function markersOf(state: DungeonState, minX: number, minY: number, maxX: number, maxY: number): Marker[] {
  const markers: Marker[] = []
  const within = (cell: Vec): Vec | null => {
    const at = fromDungeon(state.world, cell)
    return at.x < minX || at.x > maxX || at.y < minY || at.y > maxY ? null : at
  }
  for (const goal of state.world.goals) {
    const at = within(goal)
    if (at) markers.push({ x: at.x, y: at.y, ...goalLook(goal.color, goalSatisfied(goal, state.crateAt)) })
  }
  state.world.doors.forEach((door, id) => {
    const at = within(door)
    if (at) markers.push({ x: at.x, y: at.y, ...doorLook(state.opened.has(id), door.opensWhen) })
  })
  for (const crate of state.live) {
    const at = within(crate)
    if (at) markers.push({ x: at.x, y: at.y, ...crateLook(crate.color, crateIsSettled(state, crate)) })
  }
  return markers
}

function crateIsSettled(state: DungeonState, crate: Crate): boolean {
  return state.world.goals.some((goal) => goal.x === crate.x && goal.y === crate.y && goal.color === crate.color)
}

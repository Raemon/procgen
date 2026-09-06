import type { Marker } from '@/features/asset-library/worlds/worldSampler'
import { crateLook } from '../art/crateLook'
import { doorLook } from '../art/doorLook'
import { goalLook } from '../art/goalLook'
import { fromDungeon } from '../node/worldValue'
import { goalSatisfied } from '../play/goals'
import type { Crate, Vec, World } from '../types'
import type { DungeonState } from './dungeonState'

interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function markersOf(state: DungeonState, minX: number, minY: number, maxX: number, maxY: number): Marker[] {
  const bounds = { minX, minY, maxX, maxY }
  return [...goalMarkers(state, bounds), ...doorMarkers(state, bounds), ...crateMarkers(state, bounds)]
}

function goalMarkers(state: DungeonState, bounds: Bounds): Marker[] {
  return state.world.goals.flatMap((goal) => {
    const at = shownAt(state.world, goal, bounds)
    return at ? [{ ...at, ...goalLook(goal.color, goalSatisfied(goal, state.crateAt)) }] : []
  })
}

function doorMarkers(state: DungeonState, bounds: Bounds): Marker[] {
  return state.world.doors.flatMap((door, id) => {
    const at = shownAt(state.world, door, bounds)
    return at ? [{ ...at, ...doorLook(state.opened.has(id), door.opensWhen) }] : []
  })
}

function crateMarkers(state: DungeonState, bounds: Bounds): Marker[] {
  return state.live.flatMap((crate) => {
    const at = shownAt(state.world, crate, bounds)
    return at ? [{ ...at, ...crateLook(crate.color, crateIsSettled(state, crate)) }] : []
  })
}

function shownAt(world: World, cell: Vec, bounds: Bounds): Vec | null {
  const at = fromDungeon(world, cell)
  return at.x < bounds.minX || at.x > bounds.maxX || at.y < bounds.minY || at.y > bounds.maxY ? null : at
}

function crateIsSettled(state: DungeonState, crate: Crate): boolean {
  return state.world.goals.some((goal) => goal.x === crate.x && goal.y === crate.y && goal.color === crate.color)
}

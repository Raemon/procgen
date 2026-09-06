import { cellWithin, circuitTouches, type Circuit } from '@/features/game/circuits/circuit'
import type { Cell } from '@/features/game/worldRules'
import { fromDungeon } from '../node/worldValue'
import { goalSatisfied } from '../play/goals'
import { roomSolved } from '../play/rooms'
import type { RoomWiring } from '../play/wiring'
import type { DungeonState } from './dungeonState'

export function circuitsOf(nodeId: string, state: DungeonState, wiring: RoomWiring[], minX: number, minY: number, maxX: number, maxY: number): Circuit[] {
  return wiring.map((room) => circuitOf(nodeId, state, room)).filter((circuit) => circuitTouches(circuit, minX, minY, maxX, maxY))
}

export function cratesOf(state: DungeonState, minX: number, minY: number, maxX: number, maxY: number): Cell[] {
  return state.live.map((crate) => fromDungeon(state.world, crate)).filter((at) => cellWithin(at, minX, minY, maxX, maxY))
}

function circuitOf(nodeId: string, state: DungeonState, room: RoomWiring): Circuit {
  const { world } = state
  return {
    key: `${nodeId}:room ${room.room}`,
    plates: room.goals.map((goal) => ({ ...fromDungeon(world, goal), lit: goalSatisfied(goal, state.crateAt) })),
    doors: room.doors.map((id) => ({ ...fromDungeon(world, world.doors[id]!), open: state.opened.has(id) })),
    wires: room.wires.map((cell) => fromDungeon(world, cell)),
    powered: roomSolved(world, state.live, room.room),
  }
}

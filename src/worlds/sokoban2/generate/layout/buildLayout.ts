import type { GenParams } from '../../params'
import type { Rng } from '../../rng'
import type { Door, RoomRect } from '../../types'
import { clusterSlots } from './clusterSlots'
import { addLoopEdges, adjacency, bindDoor, doorNeighbors, placeDoor, spanningTreeEdges } from './doorGraph'
import { latticeFor } from './lattice'
import { assignDepths } from './roomDepths'
import { roomFromSlots } from './roomShapes'

export interface Layout {
  width: number
  height: number
  rooms: RoomRect[]
  doors: Door[]

  neighbors: number[][]

  order: number[]
  maxDepth: number
}

export function buildLayout(params: GenParams, rng: Rng): Layout {
  const { cols, rows } = params
  const lattice = latticeFor(params)
  const clusters = clusterSlots(cols, rows, Math.max(1, params.maxRoomSlots), rng)
  const rooms = clusters.map((slots, id) => roomFromSlots(id, slots, lattice))

  const adjacent = adjacency(rooms)
  const edges = spanningTreeEdges(adjacent, rng)
  addLoopEdges(edges, adjacent, params.loopChance, rng)
  const placed = edges.map((edge) => placeDoor(rooms[edge.a]!, rooms[edge.b]!, lattice, rng))

  const neighbors = doorNeighbors(rooms.length, edges)
  const { order, maxDepth } = assignDepths(rooms, neighbors)
  const doors = placed.map((door) => bindDoor(door, rooms))

  return {
    width: cols * lattice.slotW + 1,
    height: rows * lattice.slotH + 1,
    rooms,
    doors,
    neighbors,
    order,
    maxDepth,
  }
}

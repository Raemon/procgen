import type { Rng } from '../../rng'
import type { Door, RoomRect, Vec } from '../../types'
import { SLOT_STEPS, slotKey, slotKeySet, wallCellsToward, type Lattice } from './lattice'

export interface Edge {
  a: number
  b: number
}

export function adjacency(rooms: RoomRect[]): number[][] {
  const roomOfSlot = new Map(rooms.flatMap((room) => room.slots.map((slot) => [slotKey(slot.x, slot.y), room.id] as const)))
  const neighbors: number[][] = rooms.map(() => [])
  const linked = new Set<string>()
  for (const room of rooms) {
    for (const slot of room.slots) {
      const right = roomOfSlot.get(slotKey(slot.x + 1, slot.y))
      const down = roomOfSlot.get(slotKey(slot.x, slot.y + 1))
      if (right !== undefined) linkOnce(neighbors, linked, room.id, right)
      if (down !== undefined) linkOnce(neighbors, linked, room.id, down)
    }
  }
  return neighbors
}

function linkOnce(neighbors: number[][], linked: Set<string>, a: number, b: number): void {
  if (a === b || linked.has(edgeKey({ a, b }))) return
  linked.add(edgeKey({ a, b }))
  neighbors[a]!.push(b)
  neighbors[b]!.push(a)
}

export function doorNeighbors(roomCount: number, edges: Edge[]): number[][] {
  const neighbors: number[][] = Array.from({ length: roomCount }, () => [])
  for (const edge of edges) {
    neighbors[edge.a]!.push(edge.b)
    neighbors[edge.b]!.push(edge.a)
  }
  return neighbors
}

function allAdjacencies(neighbors: number[][]): Edge[] {
  const edges: Edge[] = []
  for (let a = 0; a < neighbors.length; a++) {
    for (const b of neighbors[a]!) {
      if (a < b) edges.push({ a, b })
    }
  }
  return edges
}

export function spanningTreeEdges(neighbors: number[][], rng: Rng): Edge[] {
  const visited = new Set<number>([0])
  const stack = [0]
  const edges: Edge[] = []

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const options = neighbors[current!]!.filter((id) => !visited.has(id))
    if (options.length === 0) {
      stack.pop()
      continue
    }
    const next = rng.pick(options)
    visited.add(next!)
    edges.push({ a: current!, b: next! })
    stack.push(next!)
  }
  return edges
}

export function addLoopEdges(edges: Edge[], adjacent: number[][], loopChance: number, rng: Rng): void {
  const chosen = new Set(edges.map(edgeKey))
  for (const edge of allAdjacencies(adjacent)) {
    if (chosen.has(edgeKey(edge)) || !rng.bool(loopChance)) continue
    edges.push(edge)
    chosen.add(edgeKey(edge))
  }
}

export function placeDoor(a: RoomRect, b: RoomRect, lattice: Lattice, rng: Rng): Door {
  const cell = rng.pick(sharedWallCells(a, b, lattice))
  return { x: cell.x, y: cell.y, a: a.id, b: b.id, opensWhen: null }
}

export function bindDoor(door: Door, rooms: readonly { id: number; depth: number }[]): Door {
  const depthOf = (roomId: number) => rooms.find((room) => room.id === roomId)?.depth ?? 0
  const shallower = depthOf(door.a) < depthOf(door.b) ? door.a : depthOf(door.b) < depthOf(door.a) ? door.b : null
  return { ...door, opensWhen: shallower }
}

function sharedWallCells(a: RoomRect, b: RoomRect, lattice: Lattice): Vec[] {
  const theirs = slotKeySet(b.slots)
  return a.slots.flatMap((slot) =>
    SLOT_STEPS.filter(([dx, dy]) => theirs.has(slotKey(slot.x + dx, slot.y + dy))).flatMap((step) => wallCellsToward(slot, step, lattice)),
  )
}

function edgeKey(edge: Edge): string {
  return `${Math.min(edge.a, edge.b)}-${Math.max(edge.a, edge.b)}`
}

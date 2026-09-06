import type { GenParams } from '../params'
import type { Rng } from '../rng'
import type { Door, RoomRect, Vec } from '../types'

export interface Layout {
  width: number
  height: number
  rooms: RoomRect[]
  doors: Door[]

  neighbors: number[][]

  order: number[]
  maxDepth: number
}

interface Edge {
  a: number
  b: number
}

interface Lattice {
  roomW: number
  roomH: number
  slotW: number
  slotH: number
}

type SlotStep = readonly [dx: -1 | 0 | 1, dy: -1 | 0 | 1]

const SLOT_STEPS: readonly SlotStep[] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

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

function latticeFor({ roomW, roomH }: GenParams): Lattice {
  return { roomW, roomH, slotW: roomW + 1, slotH: roomH + 1 }
}

function clusterSlots(cols: number, rows: number, maxSlots: number, rng: Rng): Vec[][] {
  const assigned = new Int16Array(cols * rows).fill(-1)
  const clusters: number[][] = []
  for (const seed of rng.shuffle(range(cols * rows))) {
    if (assigned[seed] !== -1) continue
    clusters.push(growCluster(seed, clusters.length, rng.int(1, maxSlots), assigned, cols, rows, rng))
  }
  moveEntranceClusterFirst(clusters, rng)
  return clusters.map((slots) => slots.map((id) => ({ x: id % cols, y: Math.floor(id / cols) })))
}

function growCluster(seed: number, id: number, target: number, assigned: Int16Array, cols: number, rows: number, rng: Rng): number[] {
  const slots = [seed]
  assigned[seed] = id
  while (slots.length < target) {
    const frontier = growFrontier(slots, assigned, cols, rows)
    if (frontier.length === 0) break
    const next = rng.pick(frontier)
    assigned[next] = id
    slots.push(next)
  }
  return slots
}

function moveEntranceClusterFirst(clusters: number[][], rng: Rng): void {
  const home = clusters.indexOf(rng.pick(clusters))
  if (home > 0) [clusters[0]!, clusters[home]!] = [clusters[home]!, clusters[0]!]
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

function growFrontier(slots: number[], assigned: Int16Array, cols: number, rows: number): number[] {
  const frontier: number[] = []
  const seen = new Set<number>()
  for (const slot of slots) {
    for (const next of slotNeighbors(slot, cols, rows)) {
      if (assigned[next] !== -1 || seen.has(next)) continue
      seen.add(next)
      frontier.push(next)
    }
  }
  return frontier
}

function slotNeighbors(id: number, cols: number, rows: number): number[] {
  const sx = id % cols
  const sy = Math.floor(id / cols)
  const next: number[] = []
  if (sx + 1 < cols) next.push(id + 1)
  if (sx - 1 >= 0) next.push(id - 1)
  if (sy + 1 < rows) next.push(id + cols)
  if (sy - 1 >= 0) next.push(id - cols)
  return next
}

function roomFromSlots(id: number, slots: Vec[], lattice: Lattice): RoomRect {
  const cells = interiorCells(slots, lattice)
  const box = boundsOf(cells)
  const slotBox = boundsOf(slots)
  return {
    id,
    x: box.minX,
    y: box.minY,
    w: box.maxX - box.minX + 1,
    h: box.maxY - box.minY + 1,
    slotX: slotBox.minX,
    slotY: slotBox.minY,
    slots,
    cells,
    depth: 0,
  }
}

function boundsOf(points: Vec[]): { minX: number; minY: number; maxX: number; maxY: number } {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

function interiorCells(slots: Vec[], lattice: Lattice): Vec[] {
  const owned = slotKeySet(slots)
  return dedupeCells([
    ...slots.flatMap((slot) => slotInteriorCells(slot, lattice)),
    ...slots.flatMap((slot) => wallsJoiningOwnedSlots(slot, owned, lattice)),
    ...slots.flatMap((slot) => innerCornerCells(slot, owned, lattice)),
  ])
}

function slotInteriorCells(slot: Vec, { roomW, roomH, slotW, slotH }: Lattice): Vec[] {
  const ox = slot.x * slotW + 1
  const oy = slot.y * slotH + 1
  const cells: Vec[] = []
  for (let y = 0; y < roomH; y++) for (let x = 0; x < roomW; x++) cells.push({ x: ox + x, y: oy + y })
  return cells
}

function wallsJoiningOwnedSlots(slot: Vec, owned: Set<string>, lattice: Lattice): Vec[] {
  const cells: Vec[] = []
  if (owned.has(slotKey(slot.x + 1, slot.y))) cells.push(...wallCellsToward(slot, [1, 0], lattice))
  if (owned.has(slotKey(slot.x, slot.y + 1))) cells.push(...wallCellsToward(slot, [0, 1], lattice))
  return cells
}

function innerCornerCells(slot: Vec, owned: Set<string>, { slotW, slotH }: Lattice): Vec[] {
  const corners: readonly SlotStep[] = [[0, 0], [1, 0], [0, 1], [1, 1]]
  const around = corners.filter(([dx, dy]) => owned.has(slotKey(slot.x + dx, slot.y + dy))).length
  return around >= 3 ? [{ x: (slot.x + 1) * slotW, y: (slot.y + 1) * slotH }] : []
}

function wallCellsToward(slot: Vec, [dx, dy]: SlotStep, { roomW, roomH, slotW, slotH }: Lattice): Vec[] {
  if (dx !== 0) {
    const x = (slot.x + Math.max(dx, 0)) * slotW
    const oy = slot.y * slotH + 1
    return range(roomH).map((i) => ({ x, y: oy + i }))
  }
  const y = (slot.y + Math.max(dy, 0)) * slotH
  const ox = slot.x * slotW + 1
  return range(roomW).map((i) => ({ x: ox + i, y }))
}

function adjacency(rooms: RoomRect[]): number[][] {
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

function doorNeighbors(roomCount: number, edges: Edge[]): number[][] {
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

function spanningTreeEdges(neighbors: number[][], rng: Rng): Edge[] {
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

function addLoopEdges(edges: Edge[], adjacent: number[][], loopChance: number, rng: Rng): void {
  const chosen = new Set(edges.map(edgeKey))
  for (const edge of allAdjacencies(adjacent)) {
    if (chosen.has(edgeKey(edge)) || !rng.bool(loopChance)) continue
    edges.push(edge)
    chosen.add(edgeKey(edge))
  }
}

function placeDoor(a: RoomRect, b: RoomRect, lattice: Lattice, rng: Rng): Door {
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

function slotKey(x: number, y: number): string {
  return `${x},${y}`
}

function slotKeySet(slots: Vec[]): Set<string> {
  return new Set(slots.map((slot) => slotKey(slot.x, slot.y)))
}

function dedupeCells(cells: Vec[]): Vec[] {
  const seen = new Set<string>()
  return cells.filter((cell) => {
    const key = slotKey(cell.x, cell.y)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function assignDepths(rooms: RoomRect[], neighbors: number[][]): { order: number[]; maxDepth: number } {
  const seen = new Set<number>([0])
  const order: number[] = [0]
  let maxDepth = 0
  for (let head = 0; head < order.length; head++) {
    const id = order[head]
    for (const next of neighbors[id!]!) {
      if (seen.has(next)) continue
      seen.add(next)
      rooms[next]!.depth = rooms[id!]!.depth + 1
      maxDepth = Math.max(maxDepth, rooms[next]!.depth)
      order.push(next)
    }
  }
  return { order, maxDepth }
}

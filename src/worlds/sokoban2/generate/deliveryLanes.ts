import type { Rng } from '../rng'
import type { Layout } from './layout'
import { DIRS, DIR_LIST, type CrateColor, type Door, type Goal, type Vec } from '../types'
import { at, inside, isFloor, markChannel, reserve, type RoomCanvas } from '../puzzle/canvas'

export interface LaneCell {
  roomId: number
  cell: Vec
}

export interface DeliveryRoute {
  parking: Vec
  goal: Goal
  lane: LaneCell[]
}

export function routeDelivery(
  layout: Layout,
  canvases: RoomCanvas[],
  path: number[],
  color: CrateColor,
  alreadyParked: Vec[],
  takenDrops: Vec[],
  rng: Rng,
): DeliveryRoute | null {
  const supplierId = path[0]!
  const importerId = path[path.length - 1]!
  const firstDoor = doorBetween(layout, path[0]!, path[1]!)
  if (!firstDoor) return null
  const parked = reserveParking(layout, canvases[supplierId!]!, supplierId!, firstDoor, alreadyParked)
  if (!parked) return null

  const lane: LaneCell[] = parked.lane.map((cell) => ({ roomId: supplierId, cell }))
  const through = reserveThroughRooms(layout, canvases, path, rng)
  if (!through) return null
  lane.push(...through)

  const arrival = arrivalCell(layout, path)
  if (!arrival) return null
  const drop = pickDropOff(canvases[importerId!]!, arrival, takenDrops, rng)
  if (!drop) return null
  for (const cell of reserveChannel(canvases[importerId!]!, arrival, drop, rng)) lane.push({ roomId: importerId!, cell })
  return { parking: parked.parking, goal: { x: drop.x, y: drop.y, color }, lane }
}

function reserveThroughRooms(layout: Layout, canvases: RoomCanvas[], path: number[], rng: Rng): LaneCell[] | null {
  const lane: LaneCell[] = []
  for (let i = 1; i < path.length - 1; i++) {
    const inDoor = doorBetween(layout, path[i - 1]!, path[i]!)
    const outDoor = doorBetween(layout, path[i]!, path[i + 1]!)
    if (!inDoor || !outDoor) return null
    const from = entryCell(layout, path[i]!, inDoor)
    const to = entryCell(layout, path[i]!, outDoor)
    for (const cell of reserveChannel(canvases[path[i]!]!, from, to, rng)) lane.push({ roomId: path[i]!, cell })
  }
  return lane
}

function arrivalCell(layout: Layout, path: number[]): Vec | null {
  const importerId = path[path.length - 1]!
  const lastDoor = doorBetween(layout, path[path.length - 2]!, importerId!)
  return lastDoor ? entryCell(layout, importerId!, lastDoor) : null
}

export function doorBetween(layout: Layout, a: number, b: number): Door | null {
  return layout.doors.find((door) => (door.a === a && door.b === b) || (door.a === b && door.b === a)) ?? null
}

export function entryCell(layout: Layout, roomId: number, door: Door): Vec {
  const room = layout.rooms[roomId]
  for (const dir of DIR_LIST) {
    const cell = { x: door.x + DIRS[dir].x, y: door.y + DIRS[dir].y }
    if (room!.cells.some((owned) => owned.x === cell.x && owned.y === cell.y)) {
      return { x: cell.x - room!.x, y: cell.y - room!.y }
    }
  }
  return { x: 0, y: 0 }
}

function reserveParking(
  layout: Layout,
  canvas: RoomCanvas,
  roomId: number,
  door: Door,
  taken: Vec[],
): { parking: Vec; lane: Vec[] } | null {
  const room = layout.rooms[roomId]
  const entry = entryCell(layout, roomId, door)
  const inward = { x: room!.x + entry.x - door.x, y: room!.y + entry.y - door.y }
  for (const distance of parkingDistances(entry, inward, taken)) {
    const parking = { x: entry.x + inward.x * distance, y: entry.y + inward.y * distance }
    const pushFrom = { x: parking.x + inward.x, y: parking.y + inward.y }
    if (!inside(canvas, parking) || !inside(canvas, pushFrom)) continue
    return { parking, lane: reserveParkingLine(canvas, entry, inward, distance) }
  }
  return null
}

function reserveParkingLine(canvas: RoomCanvas, entry: Vec, inward: Vec, distance: number): Vec[] {
  const lane: Vec[] = []
  for (let step = 0; step <= distance + 1; step++) {
    const cell = { x: entry.x + inward.x * step, y: entry.y + inward.y * step }
    reserve(canvas, cell)
    if (step <= distance) markChannel(canvas, cell)
    lane.push(cell)
  }
  return lane
}

function parkingDistances(entry: Vec, inward: Vec, taken: Vec[]): number[] {
  const used = taken.map((cell) => distanceAlong(entry, inward, cell)).filter((step): step is number => step !== null)
  if (used.length === 0) return [2, 1, 3]
  const behind = Math.max(...used) + 1
  return [behind, behind + 1]
}

function distanceAlong(entry: Vec, inward: Vec, cell: Vec): number | null {
  const along = inward.x !== 0 ? (cell.x - entry.x) * inward.x : (cell.y - entry.y) * inward.y
  const across = inward.x !== 0 ? cell.y - entry.y : cell.x - entry.x
  return across === 0 && along > 0 ? along : null
}

function pickDropOff(canvas: RoomCanvas, arrival: Vec, taken: Vec[], rng: Rng): Vec | null {
  const options = rng.shuffle(
    Array.from({ length: canvas.w * canvas.h }, (_, id) => ({ x: id % canvas.w, y: Math.floor(id / canvas.w) })),
  )
  return options.find((cell) => usableDropOff(canvas, arrival, taken, cell)) ?? null
}

function usableDropOff(canvas: RoomCanvas, arrival: Vec, taken: Vec[], cell: Vec): boolean {
  const distance = Math.abs(cell.x - arrival.x) + Math.abs(cell.y - arrival.y)
  if (distance < 2 || distance > 5) return false
  if (!isFloor(canvas, cell)) return false
  if (taken.some((t) => t.x === cell.x && t.y === cell.y)) return false
  return !canvas.entries.some((e) => e.x === cell.x && e.y === cell.y)
}

export function reserveChannel(canvas: RoomCanvas, from: Vec, to: Vec, rng: Rng): Vec[] {
  const elbow = rng.bool(0.5) ? { x: to.x, y: from.y } : { x: from.x, y: to.y }
  const lane = [...straightLine(from, elbow), ...straightLine(elbow, to)]
  const widened: Vec[] = []
  for (const cell of lane) {
    reserve(canvas, cell)
    markChannel(canvas, cell)
    widened.push(cell)
    widened.push(...reserveShoulders(canvas, cell))
  }
  return widened
}

function reserveShoulders(canvas: RoomCanvas, cell: Vec): Vec[] {
  const shoulders: Vec[] = []
  for (const dir of DIR_LIST) {
    const neighbor = { x: cell.x + DIRS[dir].x, y: cell.y + DIRS[dir].y }
    if (!inside(canvas, neighbor)) continue
    reserve(canvas, neighbor)
    shoulders.push(neighbor)
  }
  return shoulders
}

function straightLine(from: Vec, to: Vec): Vec[] {
  const cells: Vec[] = [{ ...from }]
  let cursor = { ...from }
  const stepX = Math.sign(to.x - from.x)
  const stepY = Math.sign(to.y - from.y)
  while (cursor.x !== to.x || cursor.y !== to.y) {
    cursor = { x: cursor.x + (cursor.x !== to.x ? stepX : 0), y: cursor.y + (cursor.y !== to.y ? stepY : 0) }
    cells.push({ ...cursor })
  }
  return cells
}

export function stillFloor(canvas: RoomCanvas, cell: Vec): boolean {
  return !inside(canvas, cell) || canvas.outside[at(canvas, cell.x, cell.y)] || isFloor(canvas, cell)
}

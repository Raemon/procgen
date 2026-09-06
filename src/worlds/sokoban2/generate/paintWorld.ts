import type { Layout } from './layout'
import {
  HEIGHT,
  TILE,
  type Crate,
  type Door,
  type Goal,
  type RoomPlan,
  type Vec,
  type World,
  type WorldDelivery,
  type WorldStats,
} from '../types'
import { at, canvasCells, type RoomCanvas } from '../puzzle/canvas'
import { index, toWorld } from '../world'
import type { SupplyDelivery, SupplyPlan } from './supply'

export function paintWorld(
  layout: Layout,
  canvases: RoomCanvas[],
  rooms: RoomPlan[],
  crates: Crate[],
  seed: number,
  trace: string[],
): World {
  const world = blankWorld(layout, rooms, crates, seed, trace)
  for (const room of rooms) stampRoom(world, canvases[room.id]!, room)
  for (const door of layout.doors) cutDoorHole(world, door)
  world.goals = allGoals(rooms)
  return world
}

export function allGoals(rooms: RoomPlan[]): Goal[] {
  return rooms.flatMap((room) => room.goals)
}

function blankWorld(layout: Layout, rooms: RoomPlan[], crates: Crate[], seed: number, trace: string[]): World {
  const cellCount = layout.width * layout.height
  return {
    seed,
    width: layout.width,
    height: layout.height,
    tiles: new Uint8Array(cellCount).fill(TILE.Ground),
    heights: new Uint8Array(cellCount).fill(HEIGHT.Wall),
    roomIds: new Int16Array(cellCount).fill(-1),
    rooms,
    doors: layout.doors,
    start: { x: 1, y: 1 },
    crates,
    goals: [],
    deliveries: [],
    stats: emptyStats(),
    trace,
  }
}

function emptyStats(): WorldStats {
  return {
    rooms: 0, crates: 0, goals: 0, importRooms: 0, ledgeRooms: 0,
    maxDepth: 0, totalPullDepth: 0, generationMs: 0, retries: 0,
  }
}

function stampRoom(world: World, canvas: RoomCanvas, room: RoomPlan): void {
  for (const local of canvasCells(canvas)) stampCell(world, canvas, room, local)
}

function stampCell(world: World, canvas: RoomCanvas, room: RoomPlan, local: Vec): void {
  const localId = at(canvas, local.x, local.y)
  if (canvas.outside[localId]) return
  const terrain = canvas.height[localId]
  const id = index(world, room.x + local.x, room.y + local.y)
  world.tiles[id] = TILE.Ground
  world.heights[id]! = terrain!
  world.roomIds[id] = terrain! <= HEIGHT.Ledge ? room.id : -1
}

function cutDoorHole(world: World, door: Door): void {
  const id = index(world, door.x, door.y)
  world.tiles[id] = TILE.Door
  world.heights[id] = HEIGHT.Floor
  world.roomIds[id] = -1
}

export function deliveriesOnTheMap(supply: SupplyPlan, rooms: RoomPlan[]): WorldDelivery[] {
  return supply.deliveries.map((delivery) => deliveryOnTheMap(delivery, rooms))
}

function deliveryOnTheMap(delivery: SupplyDelivery, rooms: RoomPlan[]): WorldDelivery {
  const goal = toWorld(rooms[delivery.importerId]!, delivery.goal)
  return {
    fromRoom: delivery.supplierId,
    toRoom: delivery.importerId,
    path: [...delivery.path],
    parking: toWorld(rooms[delivery.supplierId]!, delivery.parking),
    goal: { x: goal.x, y: goal.y, color: delivery.goal.color },
  }
}

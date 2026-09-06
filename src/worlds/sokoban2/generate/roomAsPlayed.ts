import { IMPASSABLE, type Crate, type Goal, type RoomPlan, type Vec, type World } from '../types'
import { index, roomAt } from '../world'
import { makeBoard, type Board, type BoardCrate } from '../puzzle/board'
import { solveBoard } from '../puzzle/solver'
import { roomEntries } from './worldReach'
import { cellKey, localGoals } from './worldPuzzleState'

const PLAY_SOLVE_BUDGET = 60000

export type Unplayable = { roomId: number; cause: 'locals' | 'deliveries' }

export function unplayableRoom(world: World): Unplayable | null {
  for (const room of world.rooms) {
    if (room.goals.length === 0) continue
    const cause = whyUnplayable(world, room)
    if (cause) return { roomId: room.id, cause }
  }
  return null
}

function whyUnplayable(world: World, room: RoomPlan): Unplayable['cause'] | null {
  const spares = world.deliveries.filter((delivery) => delivery.fromRoom === room.id).map((delivery) => delivery.parking)
  const delivered = world.deliveries.filter((delivery) => delivery.toRoom === room.id).map((delivery) => delivery.goal)
  if (!playableFromEveryDoor(world, room.id, world.crates, spares)) return 'locals'
  if (delivered.length > 0 && !playableFromEveryDoor(world, room.id, world.crates, [...spares, ...delivered])) return 'deliveries'
  return null
}

export function playableFromEveryDoor(world: World, roomId: number, crates: Crate[], walls: Vec[]): boolean {
  const room = world.rooms[roomId]
  const goals = localGoals(world, roomId)
  if (goals.length === 0) return true
  const starts = waysIn(world, roomId)
  if (starts.length === 0) return false
  const wallKeys = new Set(walls.map(cellKey))
  const board = roomBoard(world, room!, goals, wallKeys)
  const boardCrates = cratesOnBoard(world, room!, crates, wallKeys)
  return starts.every((start) => solveBoard(board, boardCrates, localVec(room!, start), PLAY_SOLVE_BUDGET).verdict === 'solved')
}

function waysIn(world: World, roomId: number): Vec[] {
  const isEntrance = roomAt(world, world.start.x, world.start.y) === roomId
  return [...roomEntries(world, roomId), ...(isEntrance ? [world.start] : [])]
}

function cratesOnBoard(world: World, room: RoomPlan, crates: Crate[], wallKeys: Set<string>): BoardCrate[] {
  return crates
    .filter((crate) => roomAt(world, crate.x, crate.y) === room.id && !wallKeys.has(cellKey(crate)))
    .map((crate): BoardCrate => ({ cell: localCell(room, crate), color: crate.color }))
}

function roomBoard(world: World, room: RoomPlan, goals: Goal[], wallKeys: Set<string>): Board {
  const height = new Int32Array(room.w * room.h).fill(IMPASSABLE)
  for (let y = 0; y < room.h; y++) {
    for (let x = 0; x < room.w; x++) {
      const cell = { x: room.x + x, y: room.y + y }
      if (roomAt(world, cell.x, cell.y) !== room.id || wallKeys.has(cellKey(cell))) continue
      height[y * room.w + x]! = world.heights[index(world, cell.x, cell.y)]!
    }
  }
  return makeBoard(room.w, room.h, height, goals.map((goal) => ({ ...localVec(room, goal), color: goal.color })))
}

function localVec(room: RoomPlan, cell: Vec): Vec {
  return { x: cell.x - room.x, y: cell.y - room.y }
}

function localCell(room: RoomPlan, cell: Vec): number {
  return (cell.y - room.y) * room.w + (cell.x - room.x)
}

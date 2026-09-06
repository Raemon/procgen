import { DIRS, DIR_LIST, HEIGHT, type Vec } from '../types'
import type { Rng } from '../rng'
import {
  at,
  canvasCells,
  floorComponents,
  holdable,
  inRoomCount,
  inside,
  isFloor,
  isReserved,
  toBoard,
  type RoomCanvas,
} from './canvas'
import { keepClear, paintable, shapeCandidates, type LedgeShape } from './ledgeShapes'
import { createPhysics } from './physics'
import { ledgeComponents, potentialStairs, type LedgeComponent } from './deadSquares'

export interface LedgePlacement {
  cells: Vec[]

  component: number[]

  stairs: number[]

  intendedLanding?: Vec

  landings: Vec[]
}

const SINGLE_SLOT_CELLS = 56

const SINGLE_SLOT_AREA = 8
const MULTI_SLOT_AREA = 10

const MIN_DIVIDED_FLOOR = 4

export function placeLedge(canvas: RoomCanvas, shape: LedgeShape, rng: Rng, minRun = 1): LedgePlacement | null {
  const budget = inRoomCount(canvas) > SINGLE_SLOT_CELLS ? MULTI_SLOT_AREA : SINGLE_SLOT_AREA
  const clear = keepClear(canvas)
  for (const cells of rng.shuffle(shapeCandidates(canvas, shape))) {
    if (cells.length === 0 || cells.length > budget || longestRun(cells) < minRun) continue
    if (!cells.every((cell) => paintable(canvas, cell, clear))) continue
    for (const cell of cells) canvas.height[at(canvas, cell.x, cell.y)] = HEIGHT.Ledge
    const placement = analyseLedge(canvas, shape, cells, rng)
    if (placement) return placement
    for (const cell of cells) canvas.height[at(canvas, cell.x, cell.y)] = HEIGHT.Floor
  }
  return null
}

function longestRun(cells: Vec[]): number {
  const rows = new Map<number, number>()
  const columns = new Map<number, number>()
  for (const cell of cells) {
    rows.set(cell.y, (rows.get(cell.y) ?? 0) + 1)
    columns.set(cell.x, (columns.get(cell.x) ?? 0) + 1)
  }
  return Math.max(...rows.values(), ...columns.values())
}

function anchorCells(canvas: RoomCanvas): number[] {
  const anchors = canvas.entries.filter((cell) => isFloor(canvas, cell)).map((cell) => at(canvas, cell.x, cell.y))
  canvas.channel.forEach((flag, id) => {
    if (flag && canvas.height[id] === HEIGHT.Floor) anchors.push(id)
  })
  return anchors
}

export function analyseLedge(canvas: RoomCanvas, shape: LedgeShape, cells: Vec[], rng: Rng): LedgePlacement | null {
  const groups = floorComponents(canvas)
  if (groups.length !== (shape === 'divider' ? 2 : 1)) return null
  const anchors = anchorCells(canvas)
  if (!groups.some((group) => anchors.every((id) => group.has(id)))) return null
  if (shape === 'divider' && groups.some((group) => group.size < MIN_DIVIDED_FLOOR)) return null

  const board = toBoard(canvas, [])
  const phys = createPhysics(board)
  const first = at(canvas, cells[0]!.x, cells[0]!.y)
  const component = ledgeComponents(board, phys).find((group) => group.member[first] === 1)
  if (!component) return null
  if (!cells.every((cell) => component.member[at(canvas, cell.x, cell.y)] === 1)) return null

  const landings = pickLandings(canvas, component, rng)
  if (landings.length === 0 && shape !== 'divider') return null
  const stairs = potentialStairs(board, component, phys)
  if (shape === 'divider' && !crossable(canvas, component, stairs, groups)) return null
  return { cells, component: component.cells, stairs, intendedLanding: landings[0], landings }
}

function crossable(canvas: RoomCanvas, component: LedgeComponent, stairs: number[], groups: Set<number>[]): boolean {
  const climbable = climbableOf(canvas, new Set(component.cells), stairs)
  return groups.every((group) => climbable.some((id) => group.has(id)))
}

function pickLandings(canvas: RoomCanvas, component: LedgeComponent, rng: Rng): Vec[] {
  const landings = landingsOf(canvas, new Set(component.cells))
  return rng.shuffle(landings).sort((a, b) => openNeighbours(canvas, b) - openNeighbours(canvas, a))
}

function landingsOf(canvas: RoomCanvas, member: Set<number>): Vec[] {
  const landings: Vec[] = []
  const seen = new Set<number>()
  for (const id of member) {
    const ledge = { x: id % canvas.w, y: Math.floor(id / canvas.w) }
    for (const dir of DIR_LIST) {
      const delta = DIRS[dir]
      const landing = { x: ledge.x + delta.x, y: ledge.y + delta.y }
      const foothold = { x: ledge.x - delta.x, y: ledge.y - delta.y }
      if (!inside(canvas, foothold) || !member.has(at(canvas, foothold.x, foothold.y))) continue
      if (!isFloor(canvas, landing) || isReserved(canvas, landing)) continue
      if (canvas.channel[at(canvas, landing.x, landing.y)]) continue
      const cellId = at(canvas, landing.x, landing.y)
      if (seen.has(cellId)) continue
      seen.add(cellId)
      landings.push(landing)
    }
  }
  return landings
}

export function ledgeHealth(canvas: RoomCanvas, cells: Vec[]): { landings: number; stairs: number } {
  const member = new Set(cells.map((cell) => at(canvas, cell.x, cell.y)))
  const stairs: number[] = []
  for (const cell of canvasCells(canvas)) {
    if (!isFloor(canvas, cell)) continue
    let touches = false
    let approach = false
    for (const dir of DIR_LIST) {
      const next = { x: cell.x + DIRS[dir].x, y: cell.y + DIRS[dir].y }
      if (inside(canvas, next) && member.has(at(canvas, next.x, next.y))) touches = true
      if (isFloor(canvas, next)) approach = true
    }
    if (touches && approach) stairs.push(at(canvas, cell.x, cell.y))
  }
  return { landings: landingsOf(canvas, member).length, stairs: climbableOf(canvas, member, stairs).length }
}

export function climbableStairs(canvas: RoomCanvas, placement: LedgePlacement): number[] {
  return climbableOf(canvas, new Set(placement.component), placement.stairs)
}

function climbableOf(canvas: RoomCanvas, component: Set<number>, stairs: number[]): number[] {
  return stairs.filter((id) => {
    const cell = { x: id % canvas.w, y: Math.floor(id / canvas.w) }
    return DIR_LIST.some((dir) => {
      const delta = DIRS[dir]
      const ledge = { x: cell.x + delta.x, y: cell.y + delta.y }
      const approach = { x: cell.x - delta.x, y: cell.y - delta.y }
      return inside(canvas, ledge) && component.has(at(canvas, ledge.x, ledge.y)) && isFloor(canvas, approach)
    })
  })
}

function openNeighbours(canvas: RoomCanvas, cell: Vec): number {
  return DIR_LIST.filter((dir) => holdable(canvas, { x: cell.x + DIRS[dir].x, y: cell.y + DIRS[dir].y })).length
}

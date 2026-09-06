import { DIRS, DIR_LIST, type Vec } from '../types'
import { at, canvasCells, inside, isFloor, isReserved, type RoomCanvas } from './canvas'

export type LedgeShape = 'shelf' | 'pier' | 'divider'

const PIER_LENGTHS = [2, 3, 4, 5]
const SHELF_SIZES: [number, number][] = [
  [2, 2],
  [2, 3],
  [3, 2],
  [3, 3],
  [2, 4],
  [4, 2],
]

export function shapeCandidates(canvas: RoomCanvas, shape: LedgeShape): Vec[][] {
  if (shape === 'shelf') return shelves(canvas)
  if (shape === 'pier') return piers(canvas)
  return dividers(canvas)
}

export function keepClear(canvas: RoomCanvas): Set<number> {
  const clear = new Set<number>()
  const seeds: Vec[] = [...canvas.entries]
  canvas.channel.forEach((flag, id) => {
    if (flag) seeds.push({ x: id % canvas.w, y: Math.floor(id / canvas.w) })
  })
  for (const seed of seeds) {
    if (!inside(canvas, seed)) continue
    clear.add(at(canvas, seed.x, seed.y))
    for (const dir of DIR_LIST) {
      const next = { x: seed.x + DIRS[dir].x, y: seed.y + DIRS[dir].y }
      if (inside(canvas, next)) clear.add(at(canvas, next.x, next.y))
    }
  }
  return clear
}

export function paintable(canvas: RoomCanvas, cell: Vec, clear: Set<number>): boolean {
  if (!isFloor(canvas, cell) || isReserved(canvas, cell)) return false
  return !clear.has(at(canvas, cell.x, cell.y))
}

function shelves(canvas: RoomCanvas): Vec[][] {
  const out: Vec[][] = []
  for (const [w, h] of SHELF_SIZES) {
    for (let y = 0; y + h <= canvas.h; y++) {
      for (let x = 0; x + w <= canvas.w; x++) {
        const cells = rectangleAt(x, y, w, h)
        if (cells.some((cell) => touchesWall(canvas, cell))) out.push(cells)
      }
    }
  }
  return out
}

function rectangleAt(x: number, y: number, w: number, h: number): Vec[] {
  const cells: Vec[] = []
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) cells.push({ x: x + dx, y: y + dy })
  return cells
}

function piers(canvas: RoomCanvas): Vec[][] {
  const out: Vec[][] = []
  for (const dir of DIR_LIST) {
    const delta = DIRS[dir]
    for (const root of canvasCells(canvas)) {
      if (!wallCell(canvas, { x: root.x - delta.x, y: root.y - delta.y })) continue
      for (const length of PIER_LENGTHS) {
        const cells = pierFrom(root, delta, length)
        if (hasDropRoom(canvas, cells[length - 1]!, delta)) out.push(cells)
      }
    }
  }
  return out
}

function pierFrom(root: Vec, delta: Vec, length: number): Vec[] {
  const cells: Vec[] = []
  for (let step = 0; step < length; step++) cells.push({ x: root.x + delta.x * step, y: root.y + delta.y * step })
  return cells
}

function hasDropRoom(canvas: RoomCanvas, end: Vec, delta: Vec): boolean {
  const openOne = { x: end.x + delta.x, y: end.y + delta.y }
  const openTwo = { x: end.x + delta.x * 2, y: end.y + delta.y * 2 }
  return isFloor(canvas, openOne) && isFloor(canvas, openTwo)
}

function dividers(canvas: RoomCanvas): Vec[][] {
  const out: Vec[][] = []
  for (let y = 0; y < canvas.h; y++) {
    out.push(canvasCells(canvas).filter((cell) => cell.y === y && isFloor(canvas, cell)))
  }
  for (let x = 0; x < canvas.w; x++) {
    out.push(canvasCells(canvas).filter((cell) => cell.x === x && isFloor(canvas, cell)))
  }
  return out.filter((cells) => cells.length > 0)
}

function wallCell(canvas: RoomCanvas, cell: Vec): boolean {
  return !inside(canvas, cell) || canvas.outside[at(canvas, cell.x, cell.y)]!
}

function touchesWall(canvas: RoomCanvas, cell: Vec): boolean {
  return DIR_LIST.some((dir) => wallCell(canvas, { x: cell.x + DIRS[dir].x, y: cell.y + DIRS[dir].y }))
}

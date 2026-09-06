import { DIRS, DIR_LIST } from '../types'
import {
  at,
  cellsOutsideRect,
  channelCells,
  holdableCells,
  inRoomCount,
  inside,
  rectCells,
  rectHolds,
  type Rect,
  type RoomCanvas,
} from '../puzzle/canvas'

const BAY_ROOM_CELLS = 56
const BAY_SIZES = [{ x: 7, y: 7 }, { x: 7, y: 9 }, { x: 9, y: 7 }]
const BAY_MIN_CELLS = 34

const BIG_ROOM_CELLS = 50

export function chooseBay(canvas: RoomCanvas): Rect | null {
  if (inRoomCount(canvas) <= BAY_ROOM_CELLS) return null
  let best: { rect: Rect; score: number } | null = null
  for (const size of BAY_SIZES) {
    for (let y = 0; y + size.y <= canvas.h; y++) {
      for (let x = 0; x + size.x <= canvas.w; x++) {
        const rect = { x, y, w: size.x, h: size.y }
        const score = bayScore(canvas, rect)
        if (score !== null && (!best || score > best.score)) best = { rect, score }
      }
    }
  }
  return best?.rect ?? null
}

function bayScore(canvas: RoomCanvas, rect: Rect): number | null {
  const cells = rectCells(canvas, rect)
  if (cells.length < BAY_MIN_CELLS) return null
  const lane = cells.filter((cell) => canvas.channel[at(canvas, cell.x, cell.y)]).length
  const doorways = canvas.entries.some((entry) => rectHolds(rect, entry)) ? 1 : 0
  return cells.length - 4 * lane + 6 * doorways
}

export function forbiddenRestCells(canvas: RoomCanvas, bay: Rect | null): Set<number> {
  return new Set<number>([...laneCells(canvas), ...outsideBay(canvas, bay)])
}

function laneCells(canvas: RoomCanvas): number[] {
  const lane = channelCells(canvas)
  const cells = [...lane]
  for (const id of lane) {
    const cell = { x: id % canvas.w, y: Math.floor(id / canvas.w) }
    for (const dir of DIR_LIST) {
      const beside = { x: cell.x + DIRS[dir].x, y: cell.y + DIRS[dir].y }
      if (inside(canvas, beside)) cells.push(at(canvas, beside.x, beside.y))
    }
  }
  return cells
}

function outsideBay(canvas: RoomCanvas, bay: Rect | null): number[] {
  return bay ? cellsOutsideRect(canvas, bay).map((cell) => at(canvas, cell.x, cell.y)) : []
}

export function crateCap(canvas: RoomCanvas): number {
  return holdableCells(canvas).length > BIG_ROOM_CELLS ? 2 : 3
}

import { DIRS, DIR_LIST, HEIGHT, IMPASSABLE, type Dir, type Goal, type Vec } from '../types'
import type { Rng } from '../rng'
import { makeBoard, type Board } from './board'

const OUTSIDE = 255

export interface RoomCanvas {
  w: number
  h: number
  height: Uint8Array

  reserved: boolean[]

  channel: boolean[]
  outside: boolean[]

  entries: Vec[]
}

export function makeCanvas(w: number, h: number): RoomCanvas {
  return {
    w,
    h,
    height: new Uint8Array(w * h).fill(HEIGHT.Floor),
    reserved: new Array(w * h).fill(false),
    channel: new Array(w * h).fill(false),
    outside: new Array(w * h).fill(false),
    entries: [],
  }
}

export function maskToCells(canvas: RoomCanvas, locals: Vec[]): void {
  const keep = new Set(locals.map((cell) => at(canvas, cell.x, cell.y)))
  for (let id = 0; id < canvas.w * canvas.h; id++) {
    if (keep.has(id)) continue
    canvas.outside[id] = true
    canvas.height[id] = OUTSIDE
    canvas.reserved[id] = true
  }
}

export function at(canvas: { w: number }, x: number, y: number): number {
  return y * canvas.w + x
}

export function inside(canvas: { w: number; h: number }, v: Vec): boolean {
  return v.x >= 0 && v.y >= 0 && v.x < canvas.w && v.y < canvas.h
}

export function heightAt(canvas: RoomCanvas, v: Vec): number {
  return inside(canvas, v) ? canvas.height[at(canvas, v.x, v.y)]! : OUTSIDE
}

export function holdable(canvas: RoomCanvas, v: Vec): boolean {
  return heightAt(canvas, v) <= HEIGHT.Ledge
}

export function isFloor(canvas: RoomCanvas, v: Vec): boolean {
  return heightAt(canvas, v) === HEIGHT.Floor
}

function isLedge(canvas: RoomCanvas, v: Vec): boolean {
  return heightAt(canvas, v) === HEIGHT.Ledge
}

export function reserve(canvas: RoomCanvas, v: Vec): void {
  if (!inside(canvas, v) || canvas.outside[at(canvas, v.x, v.y)]) return
  canvas.reserved[at(canvas, v.x, v.y)] = true
  canvas.height[at(canvas, v.x, v.y)] = HEIGHT.Floor
}

export function markChannel(canvas: RoomCanvas, v: Vec): void {
  if (!inside(canvas, v) || canvas.outside[at(canvas, v.x, v.y)]) return
  canvas.channel[at(canvas, v.x, v.y)] = true
}

export function channelCells(canvas: RoomCanvas): Set<number> {
  const cells = new Set<number>()
  canvas.channel.forEach((flag, id) => {
    if (flag) cells.add(id)
  })
  return cells
}

export function isReserved(canvas: RoomCanvas, v: Vec): boolean {
  return inside(canvas, v) && canvas.reserved[at(canvas, v.x, v.y)]!
}

export function canvasCells(canvas: { w: number; h: number }): Vec[] {
  const cells: Vec[] = []
  for (let id = 0; id < canvas.w * canvas.h; id++) cells.push({ x: id % canvas.w, y: Math.floor(id / canvas.w) })
  return cells
}

export function cellsWhere(canvas: RoomCanvas, keep: (v: Vec) => boolean): Vec[] {
  return canvasCells(canvas).filter(keep)
}

export function holdableCells(canvas: RoomCanvas): Vec[] {
  return cellsWhere(canvas, (v) => holdable(canvas, v))
}

function floorCells(canvas: RoomCanvas): Vec[] {
  return cellsWhere(canvas, (v) => isFloor(canvas, v))
}

export function ledgeCells(canvas: RoomCanvas): Vec[] {
  return cellsWhere(canvas, (v) => isLedge(canvas, v))
}

export function inRoomCount(canvas: RoomCanvas): number {
  let count = 0
  for (const flag of canvas.outside) if (!flag) count++
  return count
}

export function components(canvas: RoomCanvas, keep: (v: Vec) => boolean): Set<number>[] {
  const seen = new Set<number>()
  const groups: Set<number>[] = []
  for (const start of canvasCells(canvas)) {
    const startId = at(canvas, start.x, start.y)
    if (seen.has(startId) || !keep(start)) continue
    const group = new Set<number>([startId])
    seen.add(startId)
    const queue = [start]
    for (let head = 0; head < queue.length; head++) {
      const cell = queue[head]
      for (const dir of DIR_LIST) {
        const next = { x: cell!.x + DIRS[dir].x, y: cell!.y + DIRS[dir].y }
        if (!inside(canvas, next) || !keep(next)) continue
        const id = at(canvas, next.x, next.y)
        if (seen.has(id)) continue
        seen.add(id)
        group.add(id)
        queue.push(next)
      }
    }
    groups.push(group)
  }
  return groups
}

export function floorComponents(canvas: RoomCanvas): Set<number>[] {
  return components(canvas, (v) => isFloor(canvas, v))
}

export function allHoldableConnected(canvas: RoomCanvas): boolean {
  return components(canvas, (v) => holdable(canvas, v)).length === 1
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function rectHolds(rect: Rect, v: Vec): boolean {
  return v.x >= rect.x && v.y >= rect.y && v.x < rect.x + rect.w && v.y < rect.y + rect.h
}

export function rectCells(canvas: RoomCanvas, rect: Rect): Vec[] {
  return cellsWhere(canvas, (v) => rectHolds(rect, v) && !canvas.outside[at(canvas, v.x, v.y)])
}

export function cellsOutsideRect(canvas: RoomCanvas, rect: Rect): Vec[] {
  return cellsWhere(canvas, (v) => !rectHolds(rect, v) && !canvas.outside[at(canvas, v.x, v.y)])
}

export function maskCells(canvas: RoomCanvas, cells: Vec[]): number[] {
  const masked: number[] = []
  for (const cell of cells) {
    const id = at(canvas, cell.x, cell.y)
    if (canvas.outside[id] || canvas.reserved[id]) continue
    canvas.reserved[id] = true
    masked.push(id)
  }
  return masked
}

export function unmaskCells(canvas: RoomCanvas, masked: number[]): void {
  for (const id of masked) canvas.reserved[id] = false
}

export type Accept = () => boolean

const connected = (canvas: RoomCanvas): Accept => () => allHoldableConnected(canvas)

export function scatterObstacles(canvas: RoomCanvas, density: number, rng: Rng): number {
  return scatterPillars(canvas, Math.floor(inRoomCount(canvas) * density), rng)
}

export function scatterPillars(canvas: RoomCanvas, count: number, rng: Rng, accept: Accept = connected(canvas)): number {
  let placed = 0
  for (const cell of rng.shuffle(floorCells(canvas))) {
    if (placed >= count) break
    if (!pillarCell(canvas, cell)) continue
    const id = at(canvas, cell.x, cell.y)
    canvas.height[id] = HEIGHT.Wall
    if (accept()) placed++
    else canvas.height[id] = HEIGHT.Floor
  }
  return placed
}

const SEGMENT_MIN = 2
const SEGMENT_MAX = 4
const SEGMENT_TRIES = 5
const ELBOW_CHANCE = 0.45

export function scatterSegments(canvas: RoomCanvas, count: number, rng: Rng, accept: Accept = connected(canvas)): number {
  let placed = 0
  for (const anchor of rng.shuffle(segmentAnchors(canvas))) {
    if (count - placed < SEGMENT_MIN) break
    for (let attempt = 0; attempt < SEGMENT_TRIES; attempt++) {
      const run = growSegment(canvas, anchor, Math.min(SEGMENT_MAX, count - placed), rng)
      if (!run) continue
      for (const cell of run) canvas.height[at(canvas, cell.x, cell.y)] = HEIGHT.Wall
      if (accept()) {
        placed += run.length
        break
      }
      for (const cell of run) canvas.height[at(canvas, cell.x, cell.y)] = HEIGHT.Floor
    }
  }
  return placed
}

function segmentAnchors(canvas: RoomCanvas): Vec[] {
  return cellsWhere(canvas, (v) => segmentCell(canvas, v) && DIR_LIST.some((dir) => backsOntoWall(canvas, step(v, dir))))
}

function backsOntoWall(canvas: RoomCanvas, v: Vec): boolean {
  return heightAt(canvas, v) >= HEIGHT.Wall
}

function growSegment(canvas: RoomCanvas, start: Vec, longest: number, rng: Rng): Vec[] | null {
  const length = rng.int(SEGMENT_MIN, Math.max(SEGMENT_MIN, longest))
  const elbow = rng.bool(ELBOW_CHANCE) ? rng.int(1, Math.max(1, length - 1)) : -1
  const cells: Vec[] = [start]
  let heading = rng.pick(DIR_LIST)
  let cursor = start
  for (let i = 1; i < length; i++) {
    if (i === elbow) heading = quarterTurn(heading, rng)
    cursor = step(cursor, heading)
    cells.push(cursor)
  }
  return cells.every((cell) => segmentCell(canvas, cell)) ? cells : null
}

function quarterTurn(dir: Dir, rng: Rng): Dir {
  return DIR_LIST[(DIR_LIST.indexOf(dir) + (rng.bool(0.5) ? 1 : 3)) % DIR_LIST.length]!
}

function step(v: Vec, dir: Dir): Vec {
  return { x: v.x + DIRS[dir].x, y: v.y + DIRS[dir].y }
}

function pillarCell(canvas: RoomCanvas, v: Vec): boolean {
  return isFloor(canvas, v) && !isReserved(canvas, v) && !canvas.channel[at(canvas, v.x, v.y)]
}

function segmentCell(canvas: RoomCanvas, v: Vec): boolean {
  if (!pillarCell(canvas, v)) return false
  if (canvas.entries.some((entry) => Math.abs(entry.x - v.x) + Math.abs(entry.y - v.y) <= 1)) return false
  return !DIR_LIST.some((dir) => isLedge(canvas, step(v, dir)))
}

export function clearTerrain(canvas: RoomCanvas): void {
  for (let id = 0; id < canvas.height.length; id++) {
    if (!canvas.outside[id]) canvas.height[id] = HEIGHT.Floor
  }
}

export function toBoard(canvas: RoomCanvas, goals: Goal[]): Board {
  const height = new Int32Array(canvas.w * canvas.h)
  for (let id = 0; id < height.length; id++) {
    const terrain = canvas.height[id]
    height[id] = terrain! <= HEIGHT.Ledge ? terrain! : IMPASSABLE
  }
  return makeBoard(canvas.w, canvas.h, height, goals)
}

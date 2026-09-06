import { CLIMB, HEIGHT, colorIndex, type CrateColor } from '../types'
import type { Board, BoardCrate } from './board'

const BLOCKED = 255

export interface FloodResult {
  count: number

  minCell: number
  words: Uint32Array
  mark: Int32Array
  stamp: number
}

export interface BoardPhysics {
  board: Board
  w: number
  h: number
  size: number
  terrain: Uint8Array

  column: Uint16Array

  around: Int32Array
  crateStamp: Int32Array
  crateColor: Int8Array
  stamp: number
  deltas: [number, number, number, number]
  stack: Int32Array
  slots: FloodResult[]
  marks: number
}

const FLOOD_SLOTS = 2

export function createPhysics(board: Board): BoardPhysics {
  const size = board.w * board.h
  const terrain = new Uint8Array(size)
  for (let cell = 0; cell < size; cell++) {
    const height = board.height[cell]
    terrain[cell] = height! <= HEIGHT.Ledge ? height! : BLOCKED
  }
  const column = new Uint16Array(size)
  for (let cell = 0; cell < size; cell++) column[cell] = cell % board.w
  const deltas: [number, number, number, number] = [-1, 1, -board.w, board.w]
  const around = new Int32Array(size * 4)
  for (let cell = 0; cell < size; cell++) {
    for (let dir = 0; dir < 4; dir++) {
      const delta = deltas[dir]
      const next = cell + delta!
      const wraps = (delta === 1 && column[next] === 0) || (delta === -1 && column[cell] === 0)
      around[cell * 4 + dir] = next < 0 || next >= size || wraps ? -1 : next
    }
  }
  const words = (size + 31) >> 5
  const slots: FloodResult[] = []
  for (let slot = 0; slot < FLOOD_SLOTS; slot++) {
    slots.push({ count: 0, minCell: -1, words: new Uint32Array(words), mark: new Int32Array(size), stamp: 0 })
  }
  return {
    board,
    w: board.w,
    h: board.h,
    size,
    terrain,
    column,
    around,
    crateStamp: new Int32Array(size),
    crateColor: new Int8Array(size).fill(-1),
    stamp: 0,
    deltas,
    stack: new Int32Array(size),
    slots,
    marks: 0,
  }
}

export function advance(phys: BoardPhysics, cell: number, delta: number): number {
  const next = cell + delta
  if (next < 0 || next >= phys.size) return -1
  if (delta === 1) return phys.column[next] === 0 ? -1 : next
  if (delta === -1) return phys.column[cell] === 0 ? -1 : next
  return next
}

export function holdable(phys: BoardPhysics, cell: number): boolean {
  return phys.terrain[cell]! <= HEIGHT.Ledge
}

export function hasCrate(phys: BoardPhysics, cell: number): boolean {
  return phys.crateStamp[cell] === phys.stamp
}

function surfaceAt(phys: BoardPhysics, cell: number): number {
  const terrain = phys.terrain[cell]
  if (terrain! > HEIGHT.Ledge) return terrain!
  return terrain! + (hasCrate(phys, cell) ? 1 : 0)
}

export function stampCrateCells(phys: BoardPhysics, cells: ArrayLike<number>, colors: ArrayLike<number>): void {
  const stamp = ++phys.stamp
  for (let i = 0; i < cells.length; i++) {
    phys.crateStamp[cells[i]!] = stamp
    phys.crateColor[cells[i]!]! = colors[i]!
  }
}

export function stampCrates(phys: BoardPhysics, crates: BoardCrate[]): void {
  const stamp = ++phys.stamp
  for (const crate of crates) {
    phys.crateStamp[crate.cell] = stamp
    phys.crateColor[crate.cell] = colorIndex(crate.color)
  }
}

export function pushLands(phys: BoardPhysics, crateCell: number, landing: number): boolean {
  if (landing < 0) return false
  if (phys.terrain[landing]! > phys.terrain[crateCell]!) return false
  return !hasCrate(phys, landing)
}

export function canStep(phys: BoardPhysics, from: number, to: number): boolean {
  if (phys.terrain[from]! > HEIGHT.Ledge) return false
  return stepsOnto(phys, surfaceAt(phys, from), from, to)
}

function stepsOnto(phys: BoardPhysics, feet: number, from: number, to: number): boolean {
  const target = phys.terrain[to]
  if (target! > HEIGHT.Ledge) return false
  const occupied = phys.crateStamp[to] === phys.stamp
  if (occupied && target === feet) return !pushLands(phys, to, advance(phys, to, to - from))
  return target! + (occupied ? 1 : 0) <= feet + CLIMB
}

function beginFlood(phys: BoardPhysics, start: number, slot: number): FloodResult {
  const result = phys.slots[slot]
  result!.stamp = ++phys.marks
  result!.words.fill(0)
  result!.count = 0
  result!.minCell = -1
  if (start < 0 || start >= phys.size || phys.terrain[start]! > HEIGHT.Ledge) return result!
  visit(result!, start)
  return result!
}

function visit(result: FloodResult, cell: number): void {
  result.mark[cell] = result.stamp
  result.words[cell >> 5]! |= 1 << (cell & 31)
  result.count++
  if (result.minCell < 0 || cell < result.minCell) result.minCell = cell
}

export function inFlood(result: FloodResult, cell: number): boolean {
  return result.mark[cell] === result.stamp
}

function inBits(words: Uint32Array, cell: number): boolean {
  return (words[cell >> 5]! & (1 << (cell & 31))) !== 0
}

export function flood(phys: BoardPhysics, start: number, slot = 0): FloodResult {
  const result = beginFlood(phys, start, slot)
  if (result.count === 0) return result
  const around = phys.around
  const stack = phys.stack
  const mark = result.mark
  let top = 0
  stack[top++] = start
  while (top > 0) {
    const cell = stack[--top]
    const feet = surfaceAt(phys, cell!)
    const base = cell! * 4
    for (let dir = 0; dir < 4; dir++) {
      const next = around[base + dir]
      if (next! < 0 || mark[next!] === result.stamp) continue
      if (!stepsOnto(phys, feet, cell!, next!)) continue
      visit(result, next!)
      stack[top++]! = next!
    }
  }
  return result
}

export function backFlood(phys: BoardPhysics, target: number, slot = 1): FloodResult {
  const result = beginFlood(phys, target, slot)
  if (result.count === 0) return result
  let top = 0
  phys.stack[top++] = target
  while (top > 0) {
    const cell = phys.stack[--top]
    const base = cell! * 4
    for (let dir = 0; dir < 4; dir++) {
      const next = phys.around[base + dir]
      if (next! < 0 || result.mark[next!] === result.stamp) continue
      if (!canStep(phys, next!, cell!)) continue
      visit(result, next!)
      phys.stack[top++]! = next!
    }
  }
  return result
}

export const PUSH_STRIDE = 3

export function pushesFrom(phys: BoardPhysics, crateCell: number, reach: Uint32Array, out: Int32Array): number {
  const height = phys.terrain[crateCell]
  const base = crateCell * 4
  let count = 0
  for (let dir = 0; dir < 4; dir++) {
    const foothold = phys.around[base + (dir ^ 1)]
    if (foothold! < 0 || phys.terrain[foothold!] !== height) continue
    if (hasCrate(phys, foothold!) || !inBits(reach, foothold!)) continue
    const landing = phys.around[base + dir]
    if (landing! < 0 || !pushLands(phys, crateCell, landing!)) continue
    out[count * PUSH_STRIDE]! = landing!
    out[count * PUSH_STRIDE + 1]! = foothold!
    out[count * PUSH_STRIDE + 2] = phys.terrain[landing!]! < height! ? 1 : 0
    count++
  }
  return count
}

export function crateCells(crates: BoardCrate[]): number[] {
  return crates.map((crate) => crate.cell)
}

export function crateColors(crates: BoardCrate[]): number[] {
  return crates.map((crate) => colorIndex(crate.color))
}

export function colorName(index: number): CrateColor {
  return index === 0 ? 'red' : 'blue'
}

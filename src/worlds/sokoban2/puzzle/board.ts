import type { CrateColor, Goal, Vec } from '../types'

export interface Board {
  w: number
  h: number

  height: Int32Array
  goals: Goal[]

  goalColor: Int8Array
}

export interface BoardCrate {
  cell: number
  color: CrateColor
}

export function cellOf(board: { w: number }, v: Vec): number {
  return v.y * board.w + v.x
}

export function vecOf(board: { w: number }, cell: number): Vec {
  return { x: cell % board.w, y: Math.floor(cell / board.w) }
}

export function makeBoard(w: number, h: number, height: ArrayLike<number>, goals: Goal[]): Board {
  const board: Board = { w, h, height: Int32Array.from(height), goals, goalColor: new Int8Array(w * h).fill(-1) }
  for (const goal of goals) board.goalColor[cellOf(board, goal)] = goal.color === 'red' ? 0 : 1
  return board
}


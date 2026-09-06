import { HEIGHT, IMPASSABLE, type CrateColor, type Goal, type Vec } from '../types'

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

function insideBoard(board: { w: number; h: number }, v: Vec): boolean {
  return v.x >= 0 && v.y >= 0 && v.x < board.w && v.y < board.h
}

export function heightAt(board: Board, v: Vec): number {
  return insideBoard(board, v) ? board.height[cellOf(board, v)]! : IMPASSABLE
}

export function standable(board: Board, v: Vec): boolean {
  return heightAt(board, v) <= HEIGHT.Ledge
}

export function makeBoard(w: number, h: number, height: ArrayLike<number>, goals: Goal[]): Board {
  const board: Board = { w, h, height: Int32Array.from(height), goals, goalColor: new Int8Array(w * h).fill(-1) }
  for (const goal of goals) board.goalColor[cellOf(board, goal)] = goal.color === 'red' ? 0 : 1
  return board
}


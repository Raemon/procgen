import type { Goal, Vec } from '../types'
import type { BoardCrate } from './board'

export interface PuzzleDraft {
  crates: BoardCrate[]
  goals: Goal[]
  player: Vec

  pulls: number

  ledgeCells: number[]
}

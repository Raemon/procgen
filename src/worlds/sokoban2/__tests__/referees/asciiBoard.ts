import { IMPASSABLE, type CrateColor, type Goal, type Vec } from '../../types'
import { makeBoard, type Board, type BoardCrate } from '../../puzzle/board'

export interface AsciiBoard {
  board: Board
  crates: BoardCrate[]
  player: Vec
}

const TERRAIN: Record<string, number> = { '#': IMPASSABLE, '.': 0, '=': 2, '@': 0, r: 0, b: 0, R: 0, B: 0, '%': 2, '&': 2, ' ': IMPASSABLE }
const CRATE: Record<string, CrateColor> = { r: 'red', b: 'blue', '%': 'red', '&': 'blue' }
const GOAL: Record<string, CrateColor> = { R: 'red', B: 'blue' }

export function boardFromAscii(rows: string[], overlay: string[] = []): AsciiBoard {
  const h = rows.length
  const w = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const height = new Int32Array(w * h)
  const goals: Goal[] = []
  const crates: BoardCrate[] = []
  let player: Vec | null = null
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const base = rows[y]?.[x] ?? ' '
      if (!(base in TERRAIN)) throw new Error(`asciiBoard: unknown character '${base}' at ${x},${y}`)
      height[y * w + x]! = TERRAIN[base]!
      for (const char of [base, overlay[y]?.[x] ?? ' ']) {
        if (CRATE[char]) crates.push({ cell: y * w + x, color: CRATE[char] })
        if (GOAL[char]) goals.push({ x, y, color: GOAL[char] })
        if (char === '@') player = { x, y }
      }
    }
  }
  if (!player) throw new Error('asciiBoard: no player (@)')
  return { board: makeBoard(w, h, height, goals), crates, player }
}

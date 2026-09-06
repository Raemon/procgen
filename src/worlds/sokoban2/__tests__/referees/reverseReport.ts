import { HEIGHT, IMPASSABLE, type CrateColor } from '../../types'
import { cellOf, type Board } from '../../puzzle/board'
import type { PuzzleDraft } from '../../puzzle/draft'

export function boardToAscii(board: Board, draft: PuzzleDraft): { rows: string[]; overlay: string[] } {
  const rows: string[] = []
  const overlay: string[] = []
  const crateAt = new Map(draft.crates.map((crate) => [crate.cell, crate.color]))
  const goalAt = new Map(draft.goals.map((goal) => [cellOf(board, goal), goal.color]))
  for (let y = 0; y < board.h; y++) {
    let row = ''
    let over = ''
    for (let x = 0; x < board.w; x++) {
      const cell = y * board.w + x
      const ledge = board.height[cell] === HEIGHT.Ledge
      const crate = crateAt.get(cell)
      const goal = goalAt.get(cell)
      row += crate
        ? crate === 'red'
          ? ledge
            ? '%'
            : 'r'
          : ledge
            ? '&'
            : 'b'
        : board.height[cell] === IMPASSABLE
          ? '#'
          : ledge
            ? '='
            : '.'
      over += draft.player.x === x && draft.player.y === y ? '@' : goal ? (goal === 'red' ? 'R' : 'B') : '.'
    }
    rows.push(row)
    overlay.push(over)
  }
  return { rows, overlay }
}

export function printDraft(label: string, board: Board, draft: PuzzleDraft): void {
  const { rows, overlay } = boardToAscii(board, draft)
  console.log(`  ${label} (${draft.pulls} pulls)`)
  for (let y = 0; y < rows.length; y++) console.log(`    ${rows[y]}   ${overlay[y]}`)
}

export function colorTally(items: { color: CrateColor }[]): string {
  return `${items.filter((item) => item.color === 'red').length}r/${items.filter((item) => item.color === 'blue').length}b`
}

export interface Tally {
  attempts: number
  drafts: number
  solved: number
  overBudget: number
  pulls: number
  pushes: number

  pushList: number[]

  decoys: number
  pockets: number
  twoColor: number
}

export function emptyTally(): Tally {
  return { attempts: 0, drafts: 0, solved: 0, overBudget: 0, pulls: 0, pushes: 0, pushList: [], decoys: 0, pockets: 0, twoColor: 0 }
}

export function histogram(values: number[]): string {
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts].sort((a, b) => a[0] - b[0]).map(([pushes, count]) => `${pushes}:${count}`).join(' ')
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]!
}

export function share(part: number, whole: number): string {
  return whole > 0 ? `${((100 * part) / whole).toFixed(0)}%` : '-'
}

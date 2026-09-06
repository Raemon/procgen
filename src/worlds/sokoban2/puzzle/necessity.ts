import { HEIGHT, colorIndex, type CrateColor } from '../types'
import { cellOf, type Board, type BoardCrate } from './board'
import { advance, createPhysics, flood, holdable, inFlood, pushLands, stampCrateCells, type BoardPhysics } from './physics'
import { solveBoard, solveBoardColorBlind, type PushEvent, type SolveReport } from './solver'
import { flattenBoard, floorComponents } from './floorShape'
import { temptingTraps } from './traps/temptingTraps'
import type { TrapOptions } from './traps/lostProofs'
import type { TemptingTrap } from './traps/trapCollector'
import type { PuzzleDraft } from './draft'

export interface NecessityReport {
  colorsBite: boolean

  colorGain: number
  ledgeNecessary: boolean

  heightGain: number | null
  stepOrdering: boolean
  wrongEdgeDrop: boolean
  divided: boolean
  notes: string[]
}

export interface NecessityOptions {
  nodeBudget?: number
  traps?: TrapOptions

  known?: TemptingTrap[]
}

const ABLATION_BUDGET = 15000

function countsByColor(items: { color: CrateColor }[]): [number, number] {
  const counts: [number, number] = [0, 0]
  for (const item of items) counts[colorIndex(item.color)]!++
  return counts
}

function ledgeCrates(board: Board, crates: BoardCrate[]): BoardCrate[] {
  return crates.filter((crate) => board.height[crate.cell] === HEIGHT.Ledge)
}

export function replayPushes(board: Board, draft: PuzzleDraft, path: PushEvent[]): boolean {
  const phys = createPhysics(board)
  const cells = draft.crates.map((crate) => crate.cell)
  const colors = draft.crates.map((crate) => colorIndex(crate.color))
  let player = cellOf(board, draft.player)
  for (const event of path) {
    const index = cells.indexOf(event.from)
    if (index < 0) return false
    stampCrateCells(phys, cells, colors)
    const delta = event.to - event.from
    const foothold = advance(phys, event.from, -delta)
    if (foothold < 0 || phys.terrain[foothold] !== phys.terrain[event.from]) return false
    if (!inFlood(flood(phys, player, 0), foothold)) return false
    if (!pushLands(phys, event.from, event.to)) return false
    cells[index] = event.to
    player = event.from
  }
  return true
}

function isDivided(board: Board, draft: PuzzleDraft): boolean {
  const components = floorComponents(board)
  if (components.length < 2) return false
  const home = components.find((component) => component.member[cellOf(board, draft.player)] === 1)
  if (!home) return false
  if (!board.goals.some((goal) => home.member[cellOf(board, goal)] === 1)) return false
  return components.some((component) => {
    if (component === home) return false
    const goals = countsByColor(board.goals.filter((goal) => component.member[cellOf(board, goal)] === 1))
    if (goals[0] + goals[1] === 0) return false
    const crates = countsByColor(draft.crates.filter((crate) => component.member[crate.cell] === 1))
    return goals[0] === crates[0] && goals[1] === crates[1]
  })
}

export function colorLever(board: Board, draft: PuzzleDraft): 'decoy' | 'pocket' | null {
  const phys = createPhysics(board)
  const mine = (cell: number, color: number) => board.goalColor[cell]! >= 0 && board.goalColor[cell] !== color
  for (const crate of draft.crates) if (mine(crate.cell, colorIndex(crate.color))) return 'decoy'
  const colors = new Set(draft.crates.map((crate) => colorIndex(crate.color)))
  for (const goal of board.goals) {
    const cell = cellOf(board, goal)
    if (openSides(phys, cell) === 1 && [...colors].some((color) => color !== colorIndex(goal.color))) return 'pocket'
  }
  return null
}

function openSides(phys: BoardPhysics, cell: number): number {
  let open = 0
  for (const delta of phys.deltas) {
    const next = advance(phys, cell, delta)
    if (next >= 0 && holdable(phys, next)) open++
  }
  return open
}

function colorAblation(board: Board, draft: PuzzleDraft, pushes: number, budget: number, notes: string[]): number {
  const blind = solveBoardColorBlind(board, draft.crates, draft.player, budget)
  if (blind.verdict !== 'solved' || blind.pushes === null) {
    notes.push(`color-blind ablation gave ${blind.verdict}`)
    return 0
  }
  return pushes - blind.pushes
}

function heightAblation(board: Board, draft: PuzzleDraft, pushes: number, budget: number, notes: string[]): number | null {
  const flat = solveBoard(flattenBoard(board), draft.crates, draft.player, budget)
  if (flat.verdict !== 'solved' || flat.pushes === null || !flat.pushPath) {
    notes.push(`flattened ablation gave ${flat.verdict}`)
    return null
  }
  if (ledgeCrates(board, draft.crates).length > 0 && replayPushes(board, draft, flat.pushPath)) {
    notes.push('flat solution still replays on the real room: heights are decoration')
  }
  return pushes - flat.pushes
}

export function necessity(
  board: Board,
  draft: PuzzleDraft,
  report: SolveReport,
  options: NecessityOptions = {},
): NecessityReport {
  const budget = options.nodeBudget ?? ABLATION_BUDGET
  const notes: string[] = []
  const traps = options.known ?? temptingTraps(board, draft, report.pushPath, options.traps)
  const kinds = new Set(traps.map((trap) => trap.kind))

  const crates = countsByColor(draft.crates)
  const goals = countsByColor(board.goals)
  const balanced = crates[0] === goals[0] && crates[1] === goals[1]
  const onLedge = ledgeCrates(board, draft.crates).length
  if (!balanced) notes.push('crates and goals are not equal per color: ledge counting does not apply')

  let colorGain = 0
  let heightGain: number | null = null
  if (report.verdict === 'solved' && report.pushes !== null) {
    colorGain = colorAblation(board, draft, report.pushes, budget, notes)
    heightGain = onLedge > 0 || board.height.some((value) => value === HEIGHT.Ledge)
      ? heightAblation(board, draft, report.pushes, budget, notes)
      : 0
  } else {
    notes.push(`base solve was ${report.verdict}: ablations skipped`)
  }

  const ledgeNecessary = balanced && onLedge > 0
  if (ledgeNecessary) notes.push(`${onLedge} ledge crate(s) must be dropped, so a climb is forced`)
  const lever = colorLever(board, draft)
  if (lever) notes.push(`colors decide before anything else: ${lever}`)
  if (kinds.has('colorMismatch')) notes.push('a certified colorMismatch trap stands in for the length test')
  if (kinds.has('prematureCrossing')) notes.push('the divider is certified: crossing early is fatal')

  return {
    colorsBite: colorGain > 0 || kinds.has('colorMismatch') || lever !== null,
    colorGain,
    ledgeNecessary,
    heightGain,
    stepOrdering: kinds.has('stepStranding'),
    wrongEdgeDrop: kinds.has('wrongEdgeDrop'),
    divided: isDivided(board, draft),
    notes,
  }
}

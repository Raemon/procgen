import { HEIGHT, type CrateColor, type Goal, type Vec } from '../../types'
import type { Rng } from '../../rng'
import { at, floorComponents, isFloor, type RoomCanvas } from '../canvas'
import type { Board } from '../board'
import { advance, type BoardPhysics } from '../physics'
import type { LedgeAnalysis } from '../deadSquares'
import { climbableStairs, type LedgePlacement } from '../ledges'

export type PullScript = 'classic' | 'ledgeDrop' | 'stepFirst' | 'ledgeTop' | 'divided'

export type ReverseStall =
  | 'goals'
  | 'goalsLanding'
  | 'goalsStep'
  | 'goalsSpots'
  | 'ledgeMatch'
  | 'start'
  | 'stepPin'
  | 'landing'
  | 'along'
  | 'climb'
  | 'divideCross'
  | 'divideOffGoal'

const STALL_ORDER: ReverseStall[] = [
  'goals',
  'goalsLanding',
  'goalsStep',
  'goalsSpots',
  'ledgeMatch',
  'start',
  'stepPin',
  'divideCross',
  'landing',
  'along',
  'divideOffGoal',
  'climb',
]

export function worst(a: ReverseStall, b: ReverseStall): ReverseStall {
  return STALL_ORDER.indexOf(b) > STALL_ORDER.indexOf(a) ? b : a
}

export type Lever = 'plain' | 'pocket' | 'decoy'

export interface ReverseOptions {
  crateCount: number

  colors: CrateColor[]
  pullEffort: number
  rng: Rng

  forbiddenRest?: Set<number>
  ledge?: LedgePlacement
  script?: PullScript

  lever?: Lever

  onStall?: (stall: ReverseStall) => void
}

export interface ReverseState {
  cells: number[]
  player: number
  pulls: number
}

export interface ReverseRun {
  board: Board
  goals: Goal[]
  colors: CrateColor[]
  history: ReverseState[]

  earliest: number
  ledgeCells: number[]
  entries: number[]
  script: PullScript
  forbiddenRest: Set<number>
  placedLedge: number[] | null
}

export interface Reverse {
  board: Board
  phys: BoardPhysics
  colors: Int8Array
  goals: Goal[]
  goalCells: number[]
  ledges: LedgeAnalysis[]
  placed: LedgeAnalysis | null

  steps: Set<number>

  climbs: Set<number>
  entries: number[]
  landing: number
  script: PullScript
  rng: Rng
  stall: ReverseStall

  decoy: boolean
}

export function stalled(rev: Reverse, stall: ReverseStall): void {
  rev.stall = worst(rev.stall, stall)
}

export function isLedgeScript(script: PullScript): boolean {
  return script === 'ledgeDrop' || script === 'stepFirst' || script === 'ledgeTop'
}

function effectiveColors(options: ReverseOptions): CrateColor[] {
  const count = Math.max(1, options.crateCount)
  return Array.from({ length: count }, (_, index) => options.colors[index % options.colors.length] ?? 'red')
}

export function useLevers(options: ReverseOptions): boolean {
  return new Set(effectiveColors(options)).size > 1
}

export function matchingLedge(ledges: LedgeAnalysis[], placement: LedgePlacement): LedgeAnalysis | null {
  const first = placement.component[0]
  return ledges.find((analysis) => first !== undefined && analysis.component.member[first] === 1) ?? null
}

export function climbCells(phys: BoardPhysics, placed: LedgeAnalysis): Set<number> {
  const cells = new Set<number>()
  for (let cell = 0; cell < phys.size; cell++) {
    if (phys.terrain[cell] !== HEIGHT.Floor) continue
    for (const delta of phys.deltas) if (dropsFromLedge(phys, placed, cell, delta)) cells.add(cell)
  }
  return cells
}

function dropsFromLedge(phys: BoardPhysics, placed: LedgeAnalysis, cell: number, delta: number): boolean {
  const ledge = advance(phys, cell, -delta)
  if (ledge < 0 || placed.component.member[ledge] !== 1) return false
  const behind = advance(phys, ledge, -delta)
  return behind >= 0 && placed.component.member[behind] === 1
}

export function ledgeCellsOf(phys: BoardPhysics): number[] {
  const cells: number[] = []
  for (let cell = 0; cell < phys.size; cell++) if (phys.terrain[cell] === HEIGHT.Ledge) cells.push(cell)
  return cells
}

export function stepsFor(canvas: RoomCanvas, placement: LedgePlacement, script: PullScript): number[] {
  const stairs = climbableStairs(canvas, placement)
  if (script !== 'divided') return stairs
  const home = homeComponent(canvas)
  return home ? stairs.filter((cell) => home.has(cell)) : stairs
}

export function homeComponent(canvas: RoomCanvas): Set<number> | undefined {
  const entries = canvas.entries.map((entry) => at(canvas, entry.x, entry.y))
  return floorComponents(canvas).find((group) => entries.some((id) => group.has(id)))
}

export function entryCells(canvas: RoomCanvas): number[] {
  return canvas.entries.filter((cell) => isFloor(canvas, cell)).map((cell) => at(canvas, cell.x, cell.y))
}

export function same(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y
}

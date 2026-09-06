import { IMPASSABLE } from '../types'
import { cellOf, makeBoard, vecOf, type Board } from '../puzzle/board'
import type { PuzzleDraft } from '../puzzle/draft'
import type { LedgeShape } from '../puzzle/ledgeShapes'
import type { SolveReport } from '../puzzle/solver'
import { necessity, type NecessityReport } from '../puzzle/necessity'
import { difficultyScore, countCongestion, countDependencies, heightWork, solutionMetrics, type SolutionMetrics } from '../puzzle/solutionMetrics'
import { temptingTraps } from '../puzzle/traps/temptingTraps'
import type { TemptingTrap } from '../puzzle/traps/trapCollector'
import type { RoomBrief2 } from './briefs'
import { boxLinesOf } from './boxLines'
import { certifies, claimsFor } from './certifyClaims'
import { metered, meteredSolve, type NodeMeter } from './nodeMeter'
import { conceptOf, describeRoomPuzzle } from './roomNotes'
import { motifKey } from './syllabus'
import { bankable, creditedTraps, trapFloor } from './trapCredit'
import { needsLedge, type Recipe, type RecipeId } from './recipes'

export interface Appraisal {
  recipeId: RecipeId
  draft: PuzzleDraft
  board: Board
  report: SolveReport
  traps: TemptingTrap[]

  credited: TemptingTrap[]

  trapCredit: number
  families: string[]

  dependencies: number
  climbs: number
  drops: number
  congestion: number
  necessity: NecessityReport
  minPushes: number

  boxLines: number
  concept: string

  motif: string

  notes: string[]

  terrain: Uint8Array
}

export interface Furnishing extends Appraisal {
  metrics: SolutionMetrics
  score: number
}

export interface Standards {
  shape: LedgeShape | null
  dock: boolean
  ledger: Map<string, number>

  parked: number[]

  entries: number[]
}

const BASE_SOLVE_BUDGET = 12000
const MIN_BOX_LINES = 2

const TRAP_OPTIONS = { maxExhaustionTraps: 0, verifyBudget: 2500, maxVerifySolves: 4 }

function trapOptionsFor(draft: PuzzleDraft) {
  const extra = Math.max(0, draft.crates.length - 2)
  return { ...TRAP_OPTIONS, verifyBudget: TRAP_OPTIONS.verifyBudget * (1 + extra), maxVerifySolves: TRAP_OPTIONS.maxVerifySolves + 2 * extra }
}

export function appraise(
  board: Board,
  draft: PuzzleDraft,
  recipe: Recipe,
  meter: NodeMeter,
  claimed: Set<string>,
  terrain: Uint8Array,
  standards: Standards,
): Appraisal | null {
  const solved = solveAndPriceLine(board, draft, recipe, meter)
  if (!solved) return null
  if (!solvableAroundParking(board, draft, standards, meter)) {
    return null
  }

  const traps = metered(meter, () => temptingTraps(board, draft, solved.report.pushPath, trapOptionsFor(draft)))
  const credited = creditedTraps(traps, recipe)
  const trapCredit = bankable(credited)
  const motif = motifOf(draft, recipe, standards)
  const floor = Math.max(trapFloor(recipe, draft), (standards.ledger.get(motif) ?? -1) + 1)
  if (trapCredit < floor) {
    return null
  }

  const proven = claimsFor(recipe, board, draft, solved.report, credited, meter)
  if (!certifies(recipe, proven, credited)) {
    return null
  }

  const dependencies = metered(meter, () => countDependencies(board, draft))
  if (dependencies < recipe.minDependencies) {
    return null
  }

  const families = [...new Set(credited.map((trap) => trap.kind))].sort()
  const concept = conceptOf(board, draft, recipe, families, credited)
  if (claimed.has(concept)) {
    return null
  }
  return {
    recipeId: recipe.id,
    draft,
    board,
    report: solved.report,
    traps,
    credited,
    trapCredit,
    families,
    dependencies,
    climbs: solved.climbs,
    drops: solved.drops,
    congestion: countCongestion(board, draft),
    necessity: proven,
    minPushes: solved.minPushes,
    boxLines: solved.boxLines,
    concept,
    motif,
    notes: [],
    terrain: Uint8Array.from(terrain),
  }
}

function solvableAroundParking(board: Board, draft: PuzzleDraft, standards: Standards, meter: NodeMeter): boolean {
  if (standards.parked.length === 0) return true
  const height = Int32Array.from(board.height)
  for (const cell of standards.parked) height[cell] = IMPASSABLE
  const walled = makeBoard(board.w, board.h, height, board.goals)
  const starts = standards.entries.length > 0 ? standards.entries : [cellOf(board, draft.player)]
  return starts.every((start) => meteredSolve(meter, walled, { ...draft, player: vecOf(board, start) }, BASE_SOLVE_BUDGET).verdict === 'solved')
}

function motifOf(draft: PuzzleDraft, recipe: Recipe, standards: Standards): string {
  const mixed = new Set(draft.crates.map((crate) => crate.color)).size > 1
  return motifKey({ recipe: recipe.id, shape: standards.shape, crates: draft.crates.length, mixed }, standards.dock)
}

interface CertifiedLine {
  report: SolveReport & { pushPath: NonNullable<SolveReport['pushPath']> }
  minPushes: number
  boxLines: number
  climbs: number
  drops: number
}

function solveAndPriceLine(board: Board, draft: PuzzleDraft, recipe: Recipe, meter: NodeMeter): CertifiedLine | null {
  const report = meteredSolve(meter, board, draft, BASE_SOLVE_BUDGET)
  if (report.verdict !== 'solved' || !report.pushPath || report.pushes === null) {
    return null
  }
  if (report.pushes < recipe.minPushes) {
    return null
  }
  const boxLines = boxLinesOf(board, report.pushPath)
  if (boxLines < MIN_BOX_LINES) {
    return null
  }
  const { climbs, drops } = heightWork(board, draft, report.pushPath)
  if (needsLedge(recipe) && climbs < 1) {
    return null
  }
  return { report: { ...report, pushPath: report.pushPath }, minPushes: report.pushes, boxLines, climbs, drops }
}

export function finalise(appraisal: Appraisal, brief: RoomBrief2): Furnishing {
  const { board, draft, report } = appraisal
  const proven = necessity(board, draft, report, { known: appraisal.credited })
  const metrics = solutionMetrics(board, draft, report.pushPath ?? [], appraisal.credited)
  const score = difficultyScore(metrics, appraisal.credited, appraisal.trapCredit)
  const priced: Appraisal = { ...appraisal, necessity: proven }
  return { ...priced, metrics, score, notes: [...describeRoomPuzzle(priced, brief, metrics, score), ...appraisal.notes] }
}

export function meetsTargets(appraisal: Appraisal, brief: RoomBrief2): boolean {
  return (
    appraisal.trapCredit >= brief.trapTarget &&
    appraisal.families.length >= brief.familyTarget &&
    appraisal.dependencies >= brief.dependencyTarget
  )
}

export function richer(candidate: Appraisal, incumbent: Appraisal): boolean {
  const left = rankOf(candidate)
  const right = rankOf(incumbent)
  for (const [index, value] of left.entries()) if (value !== right[index]) return value > right[index]!
  return false
}

function rankOf(appraisal: Appraisal): number[] {
  return [
    appraisal.trapCredit,
    appraisal.dependencies,
    appraisal.families.length,
    appraisal.climbs + appraisal.drops,
    appraisal.congestion,
    appraisal.minPushes,
    appraisal.boxLines,
  ]
}

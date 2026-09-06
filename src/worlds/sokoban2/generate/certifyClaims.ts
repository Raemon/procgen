import { HEIGHT } from '../types'
import type { Board } from '../puzzle/board'
import type { PuzzleDraft } from '../puzzle/draft'
import type { SolveReport } from '../puzzle/solver'
import { colorLever, necessity, type NecessityReport } from '../puzzle/necessity'
import type { TemptingTrap } from '../puzzle/traps/trapCollector'
import { metered, type NodeMeter } from './nodeMeter'
import type { Claim, Recipe } from './recipes'

export function certifies(recipe: Recipe, proven: NecessityReport, traps: TemptingTrap[]): boolean {
  const kinds = new Set(traps.map((trap) => trap.kind))
  const holds = (claim: Claim): boolean => {
    if (claim === 'prematureCrossing') return kinds.has('prematureCrossing')
    if (claim === 'wrongEdgeDrop') return proven.wrongEdgeDrop
    if (claim === 'stepOrdering') return proven.stepOrdering
    if (claim === 'ledgeNecessary') return proven.ledgeNecessary
    if (claim === 'divided') return proven.divided
    return proven.colorsBite
  }
  return recipe.demands.every(holds) && (recipe.eitherOf.length === 0 || recipe.eitherOf.some(holds))
}

export function claimsFor(
  recipe: Recipe,
  board: Board,
  draft: PuzzleDraft,
  report: SolveReport,
  traps: TemptingTrap[],
  meter: NodeMeter,
): NecessityReport {
  const kinds = new Set(traps.map((trap) => trap.kind))
  const colorsBite = kinds.has('colorMismatch') || colorLever(board, draft) !== null
  if (needsAblation(recipe, colorsBite)) return metered(meter, () => necessity(board, draft, report, { known: traps }))
  return {
    colorsBite,
    colorGain: 0,
    ledgeNecessary: ledgeIsNecessary(board, draft),
    heightGain: null,
    stepOrdering: kinds.has('stepStranding'),
    wrongEdgeDrop: kinds.has('wrongEdgeDrop'),
    divided: false,
    notes: [],
  }
}

function needsAblation(recipe: Recipe, colorsBite: boolean): boolean {
  const wanted = [...recipe.demands, ...recipe.eitherOf]
  return wanted.includes('divided') || (wanted.includes('colorsBite') && !colorsBite)
}

function ledgeIsNecessary(board: Board, draft: PuzzleDraft): boolean {
  const crates: [number, number] = [0, 0]
  const goals: [number, number] = [0, 0]
  for (const crate of draft.crates) crates[crate.color === 'red' ? 0 : 1]++
  for (const goal of board.goals) goals[goal.color === 'red' ? 0 : 1]++
  if (crates[0] !== goals[0] || crates[1] !== goals[1]) return false
  return draft.crates.some((crate) => board.height[crate.cell] === HEIGHT.Ledge)
}

export function claimsOf(proven: NecessityReport): string[] {
  const flags: string[] = []
  if (proven.colorsBite) flags.push('colorsBite')
  if (proven.ledgeNecessary) flags.push('ledgeNecessary')
  if (proven.stepOrdering) flags.push('stepOrdering')
  if (proven.wrongEdgeDrop) flags.push('wrongEdgeDrop')
  if (proven.divided) flags.push('divided')
  return flags
}

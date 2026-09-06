import { HEIGHT, type Vec } from '../types'
import { vecOf, type Board } from '../puzzle/board'
import { canonicalKey } from '../puzzle/uniqueness'
import type { PuzzleDraft } from '../puzzle/draft'
import type { SolutionMetrics } from '../puzzle/solutionMetrics'
import type { TemptingTrap } from '../puzzle/traps/trapCollector'
import { claimsOf } from './certifyClaims'
import type { RoomBrief2 } from './briefs'
import { RECIPES, type Recipe } from './recipes'
import type { Appraisal } from './appraise'

export function conceptOf(board: Board, draft: PuzzleDraft, recipe: Recipe, families: string[], traps: TemptingTrap[]): string {
  return canonicalKey(board, `${recipe.id}/${families.join('+')}`, fingerprint(board, draft, traps))
}

function fingerprint(board: Board, draft: PuzzleDraft, traps: TemptingTrap[]) {
  const spot = (cell: number): Vec => vecOf(board, cell)
  const ledges: Vec[] = []
  for (let cell = 0; cell < board.height.length; cell++) if (board.height[cell] === HEIGHT.Ledge) ledges.push(spot(cell))
  const byColor = <T extends { color: string }>(items: T[], color: string) => items.filter((item) => item.color === color)
  return {
    ledges,
    redGoals: byColor(draft.goals, 'red').map((goal) => ({ x: goal.x, y: goal.y })),
    blueGoals: byColor(draft.goals, 'blue').map((goal) => ({ x: goal.x, y: goal.y })),
    redCrates: byColor(draft.crates, 'red').map((crate) => spot(crate.cell)),
    blueCrates: byColor(draft.crates, 'blue').map((crate) => spot(crate.cell)),
    trapMouths: traps.flatMap((trap) => [spot(trap.from), spot(trap.to)]),
  }
}

export function describeRoomPuzzle(
  appraisal: Appraisal,
  brief: RoomBrief2,
  metrics: SolutionMetrics,
  score: number,
): string[] {
  const notes = [
    `${appraisal.recipeId} ${RECIPES[appraisal.recipeId].label}: ${difficultyLine(appraisal, metrics, score)}`,
    targetLine(appraisal, brief),
    necessityLine(appraisal),
  ]
  for (const trap of appraisal.credited.slice(0, 2)) notes.push(`trap: ${trap.kind} at push ${trap.depth}, proved by ${trap.proof}`)
  return notes
}

function difficultyLine(appraisal: Appraisal, metrics: SolutionMetrics, score: number): string {
  return (
    `traps ${appraisal.trapCredit} of ${appraisal.traps.length} certified [${appraisal.families.join(', ')}] · ` +
    `pushes ${appraisal.minPushes} · lines ${appraisal.boxLines} · deps ${appraisal.dependencies} · ` +
    `climbs ${metrics.climbs} · drops ${metrics.drops} · congestion ${appraisal.congestion} · D ${score.toFixed(1)}`
  )
}

function targetLine(appraisal: Appraisal, brief: RoomBrief2): string {
  return (
    `targets: traps ${appraisal.trapCredit}/${brief.trapTarget}, ` +
    `families ${appraisal.families.length}/${brief.familyTarget}, ` +
    `deps ${appraisal.dependencies}/${brief.dependencyTarget}`
  )
}

function necessityLine(appraisal: Appraisal): string {
  const proven = appraisal.necessity
  const flags = claimsOf(proven)
  return `necessity: ${flags.length > 0 ? flags.join(', ') : 'classic floors only'} (colorGain ${proven.colorGain}, heightGain ${proven.heightGain ?? '-'})`
}

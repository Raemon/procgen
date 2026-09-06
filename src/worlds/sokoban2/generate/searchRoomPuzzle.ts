import type { Rng } from '../rng'
import { COLORS, type CrateColor } from '../types'
import type { Rect, RoomCanvas } from '../puzzle/canvas'
import type { Board } from '../puzzle/board'
import type { PuzzleDraft } from '../puzzle/draft'
import { runReverse } from '../puzzle/reversePlay'
import { entryCells } from '../puzzle/reverse/reverseRun'
import { candidateStates } from '../puzzle/reverse/shippableStates'
import type { LedgePlacement } from '../puzzle/ledges'
import { appraise, meetsTargets, richer, type Appraisal, type Standards } from './appraise'
import type { RoomBrief2 } from './briefs'
import { noteGate } from './furnishGates'
import { exhausted, type NodeMeter } from './nodeMeter'
import { crateCap, forbiddenRestCells } from './puzzleBay'
import { crateCeiling } from './planCurriculum'
import { plannedShape, raiseTerrain } from './raiseTerrain'
import { recipeOf, type Recipe } from './recipes'

const RUNS_PER_PLAN = 2
const CANDIDATES_PER_RUN = 2
const COLOR_PLANS_PER_ATTEMPT = 1

export function searchRoomPuzzle(
  canvas: RoomCanvas,
  recipe: Recipe,
  brief: RoomBrief2,
  attempts: number,
  rng: Rng,
  claimed: Set<string>,
  meter: NodeMeter,
  onRetry: () => void,
  bay: Rect | null,
  ledger: Map<string, number>,
  parked: number[] = [],
): Appraisal | null {
  const forbiddenRest = forbiddenRestCells(canvas, bay)
  const dock = recipeOf(brief.recipeId).kind === 'import'
  const entries = entryCells(canvas)
  let best: Appraisal | null = null

  for (let attempt = 0; attempt < attempts && !exhausted(meter); attempt++) {
    const shape = plannedShape(recipe, brief, attempt)
    const placement = raiseTerrain(canvas, recipe, shape, brief, attempt, rng, bay)
    if (placement === 'failed' || placement === 'noFloors') {
      noteGate(recipe.id, placement === 'failed' ? 'placeLedge' : 'floorComponent')
      onRetry()
      continue
    }
    const wanted = Math.min(brief.crateCount, crateCap(canvas), crateCeiling(recipe))
    if (wanted < recipe.crates[0]) break
    const standards: Standards = { shape, dock, ledger, parked, entries }
    const ctx: Attempt = { canvas, recipe, brief, rng, claimed, meter, forbiddenRest, placement, standards }
    const found = trimToACertifiableCount(ctx, wanted, attempt, onRetry)
    if (found.ready) return found.ready
    if (found.best && (!best || richer(found.best, best))) best = found.best
  }
  return best
}

function trimToACertifiableCount(
  ctx: Attempt,
  wanted: number,
  attempt: number,
  onRetry: () => void,
): { ready: Appraisal | null; best: Appraisal | null } {
  let best: Appraisal | null = null
  const floor = Math.max(ctx.recipe.crates[0], ctx.brief.trapTarget >= 2 ? 2 : 1)
  for (let crateCount = wanted; crateCount >= floor; crateCount--) {
    if (exhausted(ctx.meter)) break
    for (const appraisal of tryCrateCount(ctx, crateCount, attempt, onRetry)) {
      if (crateCount < wanted) appraisal.notes.push(`trimmed to ${crateCount} crates to stay certifiable`)
      if (meetsTargets(appraisal, ctx.brief)) return { ready: appraisal, best }
      if (!best || richer(appraisal, best)) best = appraisal
    }
  }
  return { ready: null, best }
}

interface Attempt {
  canvas: RoomCanvas
  recipe: Recipe
  brief: RoomBrief2
  rng: Rng
  claimed: Set<string>
  meter: NodeMeter
  forbiddenRest: Set<number>
  placement: LedgePlacement | null
  standards: Standards
}

function tryCrateCount(ctx: Attempt, crateCount: number, attempt: number, onRetry: () => void): Appraisal[] {
  const plans = colorPlans(crateCount, ctx.brief.localColors ?? [COLORS[0]!])
  const found: Appraisal[] = []
  for (let index = 0; index < Math.min(COLOR_PLANS_PER_ATTEMPT, plans.length); index++) {
    const colors = plans[(attempt + index) % plans.length]
    if (!appraiseColorPlan(ctx, crateCount, colors!, found)) onRetry()
    if (found.length > 0) return found
  }
  return found
}

function appraiseColorPlan(ctx: Attempt, crateCount: number, colors: CrateColor[], found: Appraisal[]): boolean {
  for (let run = 0; run < RUNS_PER_PLAN && !exhausted(ctx.meter); run++) {
    const batch = draftsFor(ctx, crateCount, colors)
    if (!batch) continue
    for (const draft of batch.drafts) {
      const appraisal = appraise(batch.board, draft, ctx.recipe, ctx.meter, ctx.claimed, ctx.canvas.height, ctx.standards)
      if (appraisal) found.push(appraisal)
    }
    return true
  }
  return false
}

function draftsFor(ctx: Attempt, crateCount: number, colors: CrateColor[]): { board: Board; drafts: PuzzleDraft[] } | null {
  const run = runReverse(ctx.canvas, {
    crateCount,
    colors,
    pullEffort: ctx.brief.pullEffort,
    rng: ctx.rng,
    forbiddenRest: ctx.forbiddenRest,
    ledge: ctx.placement ?? undefined,
    script: ctx.recipe.script,
    lever: ctx.brief.lever,
    onStall: (stall) => noteGate(ctx.recipe.id, 'reverse', stall),
  })
  if (!run) return null
  const drafts = candidateStates(run).slice(0, CANDIDATES_PER_RUN)
  if (drafts.length === 0) noteGate(ctx.recipe.id, 'noCandidate')
  return drafts.length > 0 ? { board: run.board, drafts } : null
}

function colorPlans(crateCount: number, local: CrateColor[]): CrateColor[][] {
  const [red, blue] = COLORS
  if (crateCount <= 1 || local.length < 2) return [new Array<CrateColor>(crateCount).fill(local[0] ?? red!)]
  if (crateCount === 2) return [[red!, blue!]]
  return [
    [blue!, red!, red!],
    [red!, blue!, red!],
    [red!, red!, blue!],
  ]
}


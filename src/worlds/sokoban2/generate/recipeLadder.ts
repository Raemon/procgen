import type { LedgeShape } from '../puzzle/ledgeShapes'
import type { RoomBrief2 } from './briefs'
import { RECIPES, recipeOf, type Recipe, type RecipeId } from './recipes'
import { motifKey } from './syllabus'

export interface Rung {
  recipe: Recipe

  shape: LedgeShape | null

  crates?: number
}

const LEDGE_LADDER: Partial<Record<RecipeId, RecipeId[]>> = {
  R5: ['R3', 'R7', 'R2'],
  R3: ['R7', 'R2'],
  R7: ['R2'],
  R2: [],
}

export function rungsBelow(recipe: Recipe, brief: RoomBrief2, ledger: Map<string, number>): Rung[] {
  const below = LEDGE_LADDER[recipe.id]
  if (!below) return warmUpRungs(recipe, brief)
  const twoColors = (brief.localColors ?? []).length > 1
  const rungs: Rung[] = []
  for (const id of below) {
    for (const shape of orderedShapes(RECIPES[id], brief.shape)) rungs.push({ recipe: RECIPES[id], shape })
  }
  rungs.push({ recipe: twoColors ? RECIPES.R1 : RECIPES.R0, shape: null })
  const taught = (rung: Rung) =>
    ledger.has(motifKey({ recipe: rung.recipe.id, shape: rung.shape, crates: brief.crateCount, mixed: twoColors }, false))
  return [...rungs.filter((rung) => !taught(rung)), ...rungs.filter(taught)]
}

function warmUpRungs(recipe: Recipe, brief: RoomBrief2): Rung[] {
  if (recipe.id !== 'R0' || brief.crateCount >= recipe.crates[1]) return []
  return [{ recipe, shape: null, crates: recipe.crates[1] }]
}

function orderedShapes(recipe: Recipe, planned: LedgeShape | undefined): LedgeShape[] {
  const shapes = [...recipe.shapes]
  if (planned && shapes.includes(planned)) return [planned, ...shapes.filter((shape) => shape !== planned)]
  return shapes
}

export function briefForRung(brief: RoomBrief2, rung: Rung): RoomBrief2 {
  const crateCount = rung.crates ?? brief.crateCount
  const trapTarget = crateCount > 1 ? Math.max(brief.trapTarget, 2) : brief.trapTarget
  return { ...brief, shape: rung.shape ?? undefined, crateCount, trapTarget }
}

export function localRecipeFor(brief: RoomBrief2, planned: RecipeId | undefined): Recipe {
  const asked = recipeOf(brief.recipeId)
  if (asked.kind !== 'import') return asked
  return RECIPES[planned ?? 'R1']
}

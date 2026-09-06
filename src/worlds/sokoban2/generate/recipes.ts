import type { LedgeShape } from '../puzzle/ledgeShapes'
import type { PullScript } from '../puzzle/reversePlay'

export type RecipeId = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7'

export type Claim = 'colorsBite' | 'ledgeNecessary' | 'stepOrdering' | 'wrongEdgeDrop' | 'divided' | 'prematureCrossing'

export interface Recipe {
  id: RecipeId
  label: string

  tier: number
  script: PullScript

  shapes: LedgeShape[]
  crates: [number, number]

  needsColors: boolean

  demands: Claim[]

  eitherOf: Claim[]

  minTraps: number

  minPushes: number

  minDependencies: number
  kind: 'puzzle' | 'import'
}

export const RECIPES: Record<RecipeId, Recipe> = {
  R0: {
    id: 'R0', tier: 0, label: 'Warm-up', script: 'classic', shapes: [],
    crates: [1, 2], needsColors: false, demands: [], eitherOf: [], minTraps: 1, minPushes: 3, minDependencies: 0, kind: 'puzzle',
  },
  R1: {
    id: 'R1', tier: 1, label: 'Two-tone', script: 'classic', shapes: [],
    crates: [2, 2], needsColors: true, demands: ['colorsBite'], eitherOf: [], minTraps: 2, minPushes: 4, minDependencies: 0, kind: 'puzzle',
  },
  R2: {
    id: 'R2', tier: 2, label: 'Ledge drop', script: 'ledgeDrop', shapes: ['shelf', 'pier'],
    crates: [2, 2], needsColors: false, demands: ['ledgeNecessary', 'wrongEdgeDrop'], eitherOf: [], minTraps: 2, minPushes: 6, minDependencies: 1, kind: 'puzzle',
  },
  R3: {
    id: 'R3', tier: 3, label: 'Step first', script: 'stepFirst', shapes: ['shelf', 'pier'],
    crates: [2, 3], needsColors: true, demands: ['ledgeNecessary', 'stepOrdering'], eitherOf: [], minTraps: 2, minPushes: 8, minDependencies: 1, kind: 'puzzle',
  },
  R4: {
    id: 'R4', tier: 3, label: 'Divided', script: 'divided', shapes: ['divider'],
    crates: [2, 3], needsColors: true, demands: ['divided', 'prematureCrossing'], eitherOf: [], minTraps: 2, minPushes: 5, minDependencies: 1, kind: 'puzzle',
  },
  R5: {
    id: 'R5', tier: 4, label: 'Mixed', script: 'stepFirst', shapes: ['shelf', 'pier'],
    crates: [3, 3], needsColors: true, demands: ['colorsBite', 'ledgeNecessary'],
    eitherOf: ['stepOrdering', 'wrongEdgeDrop'], minTraps: 2, minPushes: 8, minDependencies: 1, kind: 'puzzle',
  },
  R6: {
    id: 'R6', tier: 1, label: 'Import dock', script: 'classic', shapes: [],
    crates: [1, 2], needsColors: false, demands: [], eitherOf: [], minTraps: 2, minPushes: 2, minDependencies: 0, kind: 'import',
  },

  R7: {
    id: 'R7', tier: 2, label: 'Keep it up', script: 'ledgeTop', shapes: ['pier', 'shelf'],
    crates: [2, 2], needsColors: false, demands: ['ledgeNecessary', 'wrongEdgeDrop'], eitherOf: [], minTraps: 2, minPushes: 5, minDependencies: 1, kind: 'puzzle',
  },
}

export const RECIPE_IDS: RecipeId[] = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']

export const CURRICULUM_IDS: RecipeId[] = ['R0', 'R1', 'R2', 'R7', 'R3', 'R5', 'R6']

export const CURRICULUM: Recipe[] = CURRICULUM_IDS.map((id) => RECIPES[id])

export function recipeOf(id: string): Recipe {
  return RECIPES[id as RecipeId] ?? RECIPES.R1
}

export function needsLedge(recipe: Recipe): boolean {
  return recipe.shapes.length > 0
}

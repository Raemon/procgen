import type { CrateColor } from '../types'
import type { LedgeShape } from '../puzzle/ledgeShapes'
import type { Lever } from '../puzzle/reverse/reverseRun'
import type { RecipeId } from './recipes'

export interface RoomBrief2 {
  recipeId: RecipeId
  label: string
  tier: number
  crateCount: number
  obstacleDensity: number
  pullEffort: number

  imports: number

  trapTarget: number

  familyTarget: number

  dependencyTarget: number

  importColors?: CrateColor[]

  localColors?: CrateColor[]

  shape?: LedgeShape

  lever?: Lever

  motif: string

  repeats: number
}

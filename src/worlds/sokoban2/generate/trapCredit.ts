import type { PuzzleDraft } from '../puzzle/draft'
import type { TemptingTrap } from '../puzzle/traps/trapCollector'
import type { Recipe } from './recipes'

const MECHANIC_TRAPS = new Set(['colorMismatch', 'wrongEdgeDrop', 'stepStranding', 'prematureCrossing'])
const WALL_HUG_TIER = 1

export const MIN_ROOM_TRAPS = 2

export function creditedTraps(traps: TemptingTrap[], recipe: Recipe): TemptingTrap[] {
  const mechanic = traps.filter((trap) => !trap.wallHug && MECHANIC_TRAPS.has(trap.kind))
  const generic = traps.filter((trap) => !trap.wallHug && trap.generic)
  const wallHugs = recipe.tier <= WALL_HUG_TIER ? traps.filter((trap) => trap.wallHug) : []
  return [...mechanic, ...generic.slice(0, 1), ...wallHugs.slice(0, 1)]
}

export function bankable(credited: TemptingTrap[]): number {
  const explained = credited.filter((trap) => trap.proof !== 'exhaustion').length
  return explained + (explained < credited.length ? 1 : 0)
}

export function trapFloor(recipe: Recipe, draft: PuzzleDraft): number {
  return draft.crates.length < 2 ? 1 : Math.max(MIN_ROOM_TRAPS, recipe.minTraps)
}

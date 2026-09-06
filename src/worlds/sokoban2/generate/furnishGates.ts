import type { RecipeId } from './recipes'

export type FurnishGate =
  | 'placeLedge'
  | 'floorComponent'
  | 'reverse'
  | 'noCandidate'
  | 'solve'
  | 'parking'
  | 'minPushes'
  | 'boxLines'
  | 'traps'
  | 'repeat'
  | 'climbs'
  | 'dependencies'
  | 'certificates'
  | 'uniqueness'
  | 'shipped'

let gateWatcher: ((recipe: RecipeId, gate: FurnishGate, detail: string) => void) | null = null

export function watchGates(watcher: ((recipe: RecipeId, gate: FurnishGate, detail: string) => void) | null): void {
  gateWatcher = watcher
}

export function noteGate(recipe: RecipeId, gate: FurnishGate, detail = ''): void {
  gateWatcher?.(recipe, gate, detail)
}

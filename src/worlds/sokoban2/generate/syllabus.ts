import type { LedgeShape } from '../puzzle/ledgeShapes'
import type { RecipeId } from './recipes'

export interface Motif {
  recipe: RecipeId
  shape: LedgeShape | null
  crates: number
  mixed: boolean

  window: [number, number]
}

const lesson = (recipe: RecipeId, shape: LedgeShape | null, crates: number, mixed: boolean, window: [number, number]): Motif => ({
  recipe,
  shape,
  crates,
  mixed,
  window,
})

export const SYLLABUS: Motif[] = [
  lesson('R0', null, 1, false, [0, 0.02]),
  lesson('R1', null, 2, true, [0.05, 0.45]),
  lesson('R2', 'shelf', 2, false, [0.02, 0.5]),
  lesson('R2', 'pier', 2, false, [0.05, 0.55]),
  lesson('R7', 'pier', 2, false, [0.08, 0.7]),
  lesson('R7', 'shelf', 2, false, [0.12, 0.75]),
  lesson('R2', 'shelf', 2, true, [0.25, 0.65]),
  lesson('R3', 'shelf', 2, true, [0.3, 0.7]),
  lesson('R2', 'pier', 2, true, [0.35, 0.7]),
  lesson('R3', 'pier', 2, true, [0.4, 0.8]),
  lesson('R7', 'pier', 2, true, [0.45, 0.85]),
  lesson('R7', 'shelf', 2, true, [0.5, 0.9]),
  lesson('R1', null, 3, true, [0.5, 1]),
  lesson('R3', 'shelf', 3, true, [0.6, 1]),
  lesson('R5', 'shelf', 3, true, [0.65, 1]),
  lesson('R3', 'pier', 3, true, [0.7, 1]),
  lesson('R5', 'pier', 3, true, [0.75, 1]),
]

export function motifRank(motif: Motif): number {
  return SYLLABUS.indexOf(motif)
}

export function motifKey(motif: Omit<Motif, 'window'>, dock: boolean): string {
  const shape = motif.shape ?? 'flat'
  const colors = motif.mixed ? 'mixed' : 'mono'
  return `${dock ? 'dock+' : ''}${motif.recipe}/${shape}/${motif.crates}/${colors}`
}

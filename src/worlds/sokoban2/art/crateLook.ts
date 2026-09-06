import { fixtureLook, type FixtureLook } from '@/features/game/fixtures/fixtureAppearance'
import { crateFaceArtIn } from '@/features/game/fixtures/fixtureFaceArt'
import type { CrateColor } from '../types'
import { TINTS } from './tints'

export function crateLook(color: CrateColor, settled: boolean): FixtureLook {
  return {
    ...fixtureLook('crate', settled),
    glyph: color === 'red' ? 'r' : 'b',
    color: TINTS[color],
    tag: settled ? `${color} crate settled on its goal, its core charged` : `${color} crate: push it along level floor, or jump onto it`,
    faceArt: crateFaceArtIn(TINTS[color], settled),
  }
}

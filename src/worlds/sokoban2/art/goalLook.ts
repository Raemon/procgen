import { fixtureLook, type FixtureLook } from '@/features/game/fixtures/fixtureAppearance'
import { plateFaceArtIn } from '@/features/game/fixtures/fixtureFaceArt'
import type { CrateColor } from '../types'
import { TINTS } from './tints'

export function goalLook(color: CrateColor, filled: boolean): FixtureLook {
  return {
    ...fixtureLook('plate', filled),
    glyph: color === 'red' ? 'R' : 'B',
    color: TINTS[color],
    tag: filled ? `${color} goal, filled and glowing` : `${color} goal: wants a ${color} crate`,
    faceArt: plateFaceArtIn(TINTS[color], filled),
  }
}

import { fixtureLook, gateLook, type FixtureLook } from '@/features/game/fixtures/fixtureAppearance'
import { crateFaceArtIn, plateFaceArtIn } from '@/features/game/fixtures/fixtureFaceArt'
import type { CrateColor } from '../types'

const TINTS: Record<CrateColor, string> = { red: '#e0544a', blue: '#4f86ff' }

export function crateLook(color: CrateColor, settled: boolean): FixtureLook {
  return {
    ...fixtureLook('crate', settled),
    glyph: color === 'red' ? 'r' : 'b',
    color: TINTS[color],
    tag: settled ? `${color} crate settled on its goal, its core charged` : `${color} crate: push it along level floor, or jump onto it`,
    faceArt: crateFaceArtIn(TINTS[color], settled),
  }
}

export function goalLook(color: CrateColor, filled: boolean): FixtureLook {
  return {
    ...fixtureLook('plate', filled),
    glyph: color === 'red' ? 'R' : 'B',
    color: TINTS[color],
    tag: filled ? `${color} goal, filled and glowing` : `${color} goal: wants a ${color} crate`,
    faceArt: plateFaceArtIn(TINTS[color], filled),
  }
}

export function doorLook(open: boolean, opensWhen: number | null): FixtureLook {
  return {
    ...gateLook('mechanism', open),
    tag: open ? 'door, standing open' : `door, shut until room ${opensWhen ?? '?'} is finished`,
  }
}

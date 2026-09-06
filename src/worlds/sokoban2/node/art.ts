import { CUBE_FACES, type CubeFaceArt, type FacePixels } from '@/features/asset-library/tiles/tileFaceArt'
import { fixtureLook, gateLook, type FixtureLook } from '@/features/game/fixtures/fixtureAppearance'
import type { CrateColor } from '../types'

const TINTS: Record<CrateColor, string> = { red: '#c8433a', blue: '#3f6fd0' }
const CRATE_TINT_STRENGTH = 0.5
const GOAL_TINT_STRENGTH = 0.6

const crateArt = new Map<string, CubeFaceArt | null>()
const goalArt = new Map<string, CubeFaceArt | null>()

export function crateLook(color: CrateColor, settled: boolean): FixtureLook {
  const base = fixtureLook('crate', settled)
  const key = `${color}:${settled}`
  if (!crateArt.has(key)) crateArt.set(key, base.faceArt && tintedFaceArt(base.faceArt, TINTS[color], CRATE_TINT_STRENGTH))
  return {
    ...base,
    glyph: color === 'red' ? 'r' : 'b',
    color: TINTS[color],
    tag: settled ? `${color} crate settled on its goal` : `${color} crate: push it along level floor, or jump onto it`,
    faceArt: crateArt.get(key) ?? null,
  }
}

export function goalLook(color: CrateColor, filled: boolean): FixtureLook {
  const base = fixtureLook('plate', filled)
  const key = `${color}:${filled}`
  if (!goalArt.has(key)) goalArt.set(key, base.faceArt && tintedFaceArt(base.faceArt, TINTS[color], GOAL_TINT_STRENGTH))
  return {
    ...base,
    glyph: color === 'red' ? 'R' : 'B',
    color: TINTS[color],
    tag: filled ? `${color} goal, filled` : `${color} goal: wants a ${color} crate`,
    faceArt: goalArt.get(key) ?? null,
  }
}

export function doorLook(open: boolean, opensWhen: number | null): FixtureLook {
  const base = gateLook('mechanism', open)
  return {
    ...base,
    tag: open ? 'door, standing open' : `door, shut until room ${opensWhen ?? '?'} is finished`,
  }
}

export function tintedFaceArt(art: CubeFaceArt, tint: string, strength: number): CubeFaceArt {
  const tinted = { ...art }
  for (const face of CUBE_FACES) tinted[face] = tintedPixels(art[face], tint, strength)
  if (art.framesAfterFirst) {
    tinted.framesAfterFirst = art.framesAfterFirst.map((frame) => ({
      ...frame,
      color: Object.fromEntries(
        Object.entries(frame.color).map(([face, pixels]) => [face, pixels ? tintedPixels(pixels, tint, strength) : pixels]),
      ),
    }))
  }
  return tinted
}

function tintedPixels(pixels: FacePixels, tint: string, strength: number): FacePixels {
  return pixels.map((pixel) => (pixel && /^#[0-9a-f]{6}$/i.test(pixel) ? blend(pixel, tint, strength) : pixel))
}

function blend(from: string, to: string, amount: number): string {
  const channel = (offset: number) => {
    const a = parseInt(from.slice(offset, offset + 2), 16)
    const b = parseInt(to.slice(offset, offset + 2), 16)
    return Math.round(a + (b - a) * amount).toString(16).padStart(2, '0')
  }
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

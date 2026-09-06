import { createHash } from 'node:crypto'
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter'
import { reportOffenders } from '@/features/app-shell/__tests__/reportOffenders'
import { generateWorld2 } from '../generate/generateWorld'
import { DEFAULT_PARAMS, type GenParams } from '../params'
import type { World } from '../types'

export const PINNED_PARAMS: GenParams = { ...DEFAULT_PARAMS, cols: 2, rows: 2, maxRoomSlots: 1, roomW: 5, roomH: 5 }

const PINS: Array<[number, string]> = [
  [11, '05b3c85ad39475eb'],
  [4711, 'e6d0563cea92f6f2'],
]

export function checkGenerationPins(check: CheckReporter): void {
  const drifted = PINS.flatMap(([seed, pinned]) => {
    const actual = worldFingerprint(generateWorld2(PINNED_PARAMS, seed))
    return actual === pinned ? [] : [`seed ${seed} now grows ${actual}, pinned ${pinned}`]
  })
  reportOffenders('pinned dungeons whose bytes moved', drifted)
  check('a pinned seed still grows the same dungeon, so a refactor that moves a byte shows up here', drifted.length === 0)
}

export function worldFingerprint(world: World): string {
  const hash = createHash('sha256')
  hash.update(world.tiles)
  hash.update(world.heights)
  hash.update(new Uint8Array(world.roomIds.buffer, world.roomIds.byteOffset, world.roomIds.byteLength))
  hash.update(
    JSON.stringify({
      start: world.start,
      crates: world.crates,
      goals: world.goals,
      doors: world.doors,
      roomGoals: world.rooms.map((room) => room.goals),
    }),
  )
  return hash.digest('hex').slice(0, 16)
}

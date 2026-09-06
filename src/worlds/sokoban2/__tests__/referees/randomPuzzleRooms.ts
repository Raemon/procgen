import { DIRS, DIR_LIST, type Vec } from '../../types'
import type { Rng } from '../../rng'

export interface Room {
  rows: string[]
  overlay: string[]
}

const CRATE_CHARS = { red: ['r', '%'], blue: ['b', '&'] }
const GOAL_CHARS = { red: 'R', blue: 'B' }

export interface RoomShape {
  min: number
  max: number
  crates: number

  reach: number
}

export function randomRoom(rng: Rng, shape: RoomShape): Room {
  for (;;) {
    const w = rng.int(shape.min, shape.max)
    const h = rng.int(shape.min, shape.max)
    const terrain: string[][] = []
    for (let y = 0; y < h; y++) {
      terrain.push(
        Array.from({ length: w }, (_, x) =>
          x === 0 || y === 0 || x === w - 1 || y === h - 1 ? '#' : rng.bool(0.12) ? '#' : '.',
        ),
      )
    }
    if (rng.bool(0.75)) paintLedge(terrain, w, h, rng)
    const holdable: Vec[] = []
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) if (terrain[y]![x] !== '#') holdable.push({ x, y })
    }
    if (holdable.length < 5) continue
    const spots = rng.shuffle(holdable)
    const overlay = terrain.map((row) => row.map(() => '.'))
    const start = spots[0]
    overlay[start!.y]![start!.x] = '@'
    const crateSpots = spots.slice(1, 1 + rng.int(1, shape.crates))
    const colors: ('red' | 'blue')[] = []
    for (const spot of crateSpots) {
      const color = rng.bool(0.5) ? 'red' : 'blue'
      colors.push(color)
      terrain[spot.y]![spot.x]! = CRATE_CHARS[color][terrain[spot.y]![spot.x] === '=' ? 1 : 0]!
    }

    for (let i = 0; i < rng.int(1, crateSpots.length); i++) {
      const color = rng.bool(0.15) ? rng.pick(['red', 'blue'] as const) : colors[i % colors.length]
      const goal = rng.bool(0.5) ? pushLine(terrain, crateSpots[i]!, rng, shape.reach) : rng.pick(spots)
      if (goal.x === start!.x && goal.y === start!.y) continue
      overlay[goal.y]![goal.x] = GOAL_CHARS[color!]
    }
    return { rows: terrain.map((row) => row.join('')), overlay: overlay.map((row) => row.join('')) }
  }
}

function pushLine(terrain: string[][], from: Vec, rng: Rng, reach: number): Vec {
  const open = (cell: Vec) => terrain[cell.y]?.[cell.x] !== undefined && terrain[cell.y]![cell.x] !== '#'
  let at = from
  for (let leg = 0; leg < 2; leg++) {
    const dir = DIRS[rng.pick(DIR_LIST)]
    for (let step = 0; step < rng.int(1, reach); step++) {
      const ahead = { x: at.x + dir.x, y: at.y + dir.y }
      const behind = { x: at.x - dir.x, y: at.y - dir.y }
      if (!open(ahead) || !open(behind)) break
      at = ahead
    }
  }
  return at
}

function paintLedge(terrain: string[][], w: number, h: number, rng: Rng): void {
  const horizontal = rng.bool(0.5)
  const line = horizontal ? rng.int(1, h - 2) : rng.int(1, w - 2)
  const from = rng.int(1, (horizontal ? w : h) - 3)
  const to = Math.min(from + rng.int(1, 2), (horizontal ? w : h) - 2)
  for (let step = from; step <= to; step++) {
    const x = horizontal ? step : line
    const y = horizontal ? line : step
    terrain[y]![x] = '='
  }
}

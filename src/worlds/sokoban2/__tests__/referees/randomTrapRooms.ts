import type { Vec } from '../../types'
import type { Rng } from '../../rng'

const CRATE_CHARS = { red: ['r', '%'], blue: ['b', '&'] }
const GOAL_CHARS = { red: 'R', blue: 'B' }

export function randomRoom(rng: Rng): { rows: string[]; overlay: string[] } {
  for (;;) {
    const w = rng.int(6, 8)
    const h = rng.int(6, 8)
    const terrain: string[][] = []
    for (let y = 0; y < h; y++) {
      terrain.push(
        Array.from({ length: w }, (_, x) =>
          x === 0 || y === 0 || x === w - 1 || y === h - 1 ? '#' : rng.bool(0.1) ? '#' : '.',
        ),
      )
    }
    if (rng.bool(0.6)) paintLedge(terrain, w, h, rng)
    const open: Vec[] = []
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) if (terrain[y]![x] !== '#') open.push({ x, y })
    }
    if (open.length < 8) continue
    const spots = rng.shuffle(open)
    const overlay = terrain.map((row) => row.map(() => '.'))
    overlay[spots[0]!.y]![spots[0]!.x] = '@'
    const count = rng.int(1, 3)
    for (let i = 0; i < count; i++) {
      const color = rng.bool(0.5) ? 'red' : 'blue'
      const crate = spots[1 + i]
      const goal = rng.bool(0.7) ? pushLine(terrain, crate!, rng) : spots[1 + count + i]
      terrain[crate!.y]![crate!.x]! = CRATE_CHARS[color][terrain[crate!.y]![crate!.x] === '=' ? 1 : 0]!
      if (overlay[goal!.y]![goal!.x] === '.') overlay[goal!.y]![goal!.x] = GOAL_CHARS[color]
    }
    return { rows: terrain.map((row) => row.join('')), overlay: overlay.map((row) => row.join('')) }
  }
}

function pushLine(terrain: string[][], from: Vec, rng: Rng): Vec {
  const open = (cell: Vec) => terrain[cell.y]?.[cell.x] !== undefined && terrain[cell.y]![cell.x] !== '#'
  let at = from
  for (let leg = 0; leg < 2; leg++) {
    const dir = rng.pick([{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }])
    for (let step = 0; step < rng.int(1, 3); step++) {
      const ahead = { x: at.x + dir.x, y: at.y + dir.y }
      if (!open(ahead) || !open({ x: at.x - dir.x, y: at.y - dir.y })) break
      at = ahead
    }
  }
  return at
}

function paintLedge(terrain: string[][], w: number, h: number, rng: Rng): void {
  const horizontal = rng.bool(0.5)
  const line = horizontal ? rng.int(1, h - 2) : rng.int(1, w - 2)
  const from = rng.int(1, (horizontal ? w : h) - 3)
  const to = Math.min(from + rng.int(1, 3), (horizontal ? w : h) - 2)
  for (let step = from; step <= to; step++) {
    const x = horizontal ? step : line
    const y = horizontal ? line : step
    terrain[y]![x] = '='
  }
}

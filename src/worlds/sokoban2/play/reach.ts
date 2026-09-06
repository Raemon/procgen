import { DIR_LIST, type Crate, type Vec, type World } from '../types'
import { crateFinder, inBounds, index } from '../world'
import { doorLock, type LockCheck } from './doors'
import type { CrateAt } from './goals'
import { moveKind } from './physics'

export function reachableCells(
  world: World,
  crates: Crate[],
  player: Vec,
  crateAt: CrateAt = crateFinder(crates),
  locked: LockCheck = doorLock(world, crates),
): Set<number> {
  const reached = new Set<number>()
  if (!inBounds(world, player.x, player.y)) return reached
  const cells = world.width * world.height
  const visited = new Uint8Array(cells)
  const queue = new Int32Array(cells)
  const at: Vec = { x: 0, y: 0 }
  let tail = 0
  const start = index(world, player.x, player.y)
  visited[start] = 1
  queue[tail++] = start
  for (let head = 0; head < tail; head++) {
    const cell = queue[head]
    reached.add(cell!)
    at.x = cell! % world.width
    at.y = (cell! / world.width) | 0
    for (const dir of DIR_LIST) {
      const outcome = moveKind(world, crateAt, at, dir, locked)
      if (outcome.kind !== 'walk' && outcome.kind !== 'climb') continue
      const next = index(world, outcome.to.x, outcome.to.y)
      if (visited[next]) continue
      visited[next] = 1
      queue[tail++] = next
    }
  }
  return reached
}

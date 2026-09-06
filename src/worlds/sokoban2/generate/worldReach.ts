import { DIRS, DIR_LIST, type Crate, type Vec, type World } from '../types'
import { crateFinder, roomAt } from '../world'
import { doorLock } from '../play/doors'
import { reachableCells } from '../play/reach'

export interface WorldReach {
  cells: Set<number>
  keyAround(cells: number[]): string
}

export function worldReach(world: World, crates: Crate[], player: Vec): WorldReach {
  const cells = reachableCells(world, crates, player, crateFinder(crates), doorLock(world, crates))
  return {
    cells,
    keyAround: (around) => around.map((cell) => (cell >= 0 && cells.has(cell) ? '1' : '0')).join(''),
  }
}

export function roomEntries(world: World, roomId: number): Vec[] {
  const entries: Vec[] = []
  for (const door of world.doors) {
    if (door.a !== roomId && door.b !== roomId) continue
    for (const dir of DIR_LIST) {
      const cell = { x: door.x + DIRS[dir].x, y: door.y + DIRS[dir].y }
      if (roomAt(world, cell.x, cell.y) === roomId) entries.push(cell)
    }
  }
  return entries
}

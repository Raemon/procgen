import { HEIGHT } from '../types'
import { makeBoard, type Board } from './board'
import { advance, createPhysics, type BoardPhysics } from './physics'
import { reversePushReach } from './deadSquares'

export interface FloorComponent {
  cells: number[]
  member: Uint8Array

  supply: Uint8Array
}

export function floorComponents(board: Board, phys = createPhysics(board)): FloorComponent[] {
  const seen = new Uint8Array(phys.size)
  const groups: FloorComponent[] = []
  for (let start = 0; start < phys.size; start++) {
    if (seen[start] === 1 || phys.terrain[start] !== HEIGHT.Floor) continue
    const cells = growFloorGroup(phys, seen, start)
    const member = new Uint8Array(phys.size)
    for (const cell of cells) member[cell] = 1
    groups.push({ cells, member, supply: reversePushReach(phys, cells) })
  }
  return groups
}

function growFloorGroup(phys: BoardPhysics, seen: Uint8Array, start: number): number[] {
  const cells = [start]
  seen[start] = 1
  for (let head = 0; head < cells.length; head++) {
    for (const delta of phys.deltas) {
      const next = advance(phys, cells[head]!, delta)
      if (next < 0 || seen[next] === 1 || phys.terrain[next] !== HEIGHT.Floor) continue
      seen[next] = 1
      cells.push(next)
    }
  }
  return cells
}

export function flattenBoard(board: Board): Board {
  const height = Int32Array.from(board.height, (value) => (value === HEIGHT.Ledge ? HEIGHT.Floor : value))
  return makeBoard(board.w, board.h, height, board.goals)
}

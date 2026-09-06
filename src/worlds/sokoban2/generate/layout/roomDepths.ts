import type { RoomRect } from '../../types'

export function assignDepths(rooms: RoomRect[], neighbors: number[][]): { order: number[]; maxDepth: number } {
  const seen = new Set<number>([0])
  const order: number[] = [0]
  let maxDepth = 0
  for (let head = 0; head < order.length; head++) {
    const id = order[head]
    for (const next of neighbors[id!]!) {
      if (seen.has(next)) continue
      seen.add(next)
      rooms[next]!.depth = rooms[id!]!.depth + 1
      maxDepth = Math.max(maxDepth, rooms[next]!.depth)
      order.push(next)
    }
  }
  return { order, maxDepth }
}

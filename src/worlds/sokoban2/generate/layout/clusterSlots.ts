import type { Rng } from '../../rng'
import type { Vec } from '../../types'
import { range } from './lattice'

export function clusterSlots(cols: number, rows: number, maxSlots: number, rng: Rng): Vec[][] {
  const assigned = new Int16Array(cols * rows).fill(-1)
  const clusters: number[][] = []
  for (const seed of rng.shuffle(range(cols * rows))) {
    if (assigned[seed] !== -1) continue
    clusters.push(growCluster(seed, clusters.length, rng.int(1, maxSlots), assigned, cols, rows, rng))
  }
  moveEntranceClusterFirst(clusters, rng)
  return clusters.map((slots) => slots.map((id) => ({ x: id % cols, y: Math.floor(id / cols) })))
}

function growCluster(seed: number, id: number, target: number, assigned: Int16Array, cols: number, rows: number, rng: Rng): number[] {
  const slots = [seed]
  assigned[seed] = id
  while (slots.length < target) {
    const frontier = growFrontier(slots, assigned, cols, rows)
    if (frontier.length === 0) break
    const next = rng.pick(frontier)
    assigned[next] = id
    slots.push(next)
  }
  return slots
}

function moveEntranceClusterFirst(clusters: number[][], rng: Rng): void {
  const home = clusters.indexOf(rng.pick(clusters))
  if (home > 0) [clusters[0]!, clusters[home]!] = [clusters[home]!, clusters[0]!]
}

function growFrontier(slots: number[], assigned: Int16Array, cols: number, rows: number): number[] {
  const frontier: number[] = []
  const seen = new Set<number>()
  for (const slot of slots) {
    for (const next of slotNeighbors(slot, cols, rows)) {
      if (assigned[next] !== -1 || seen.has(next)) continue
      seen.add(next)
      frontier.push(next)
    }
  }
  return frontier
}

function slotNeighbors(id: number, cols: number, rows: number): number[] {
  const sx = id % cols
  const sy = Math.floor(id / cols)
  const next: number[] = []
  if (sx + 1 < cols) next.push(id + 1)
  if (sx - 1 >= 0) next.push(id - 1)
  if (sy + 1 < rows) next.push(id + cols)
  if (sy - 1 >= 0) next.push(id - cols)
  return next
}

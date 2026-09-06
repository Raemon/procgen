import { HEIGHT, type Crate, type Vec, type World, type WorldDelivery } from '../types'
import { index, roomAt } from '../world'
import { clearRoomPuzzle, dropDeliveriesTouching, dropDelivery } from './dropDelivery'
import { importerLocalStillWorks } from './importerLocalPuzzle'
import { pushOneCrate, type WalkPosition } from './pushOneCrate'
import type { RefurnishRoom } from './refurnishRoom'
import {
  allGoalsFilled,
  goalsFilledBy,
  localGoals,
  overwrite,
  reachableCellInRoom,
  startPosition,
  teleportLocal,
  unfinishedRooms,
  visitOrder,
} from './worldPuzzleState'
import { roomEntries, worldReach, type WorldReach } from './worldReach'
import { unplayableRoom } from './roomAsPlayed'

export interface SettleResult {
  dropped: number
  cleared: number
  refurnished: number

  notes: string[]
}

export function settleWorld(world: World, refurnish?: RefurnishRoom): SettleResult {
  ensureReachableStart(world)
  const settled: SettleResult = { dropped: keepOnlyProvableDeliveries(world), cleared: 0, refurnished: 0, notes: [] }
  const rebuilt = new Set<number>()
  for (let attempt = 0; attempt < 2 * world.rooms.length + 1; attempt++) {
    const proof = tryProve(world)
    if (!proof.ok && proof.unreached.length === 0) break
    const fault = proof.ok ? playFault(world) : unreachedFault(proof.unreached[0]!)
    if (!fault) return settled
    salvageRoom(world, fault, rebuilt, refurnish, settled)
  }
  return settled
}

interface Fault {
  roomId: number
  reason: string
  deliveriesFirst: boolean
}

function unreachedFault(roomId: number): Fault {
  return { roomId, reason: 'unreachable once the deliveries settled', deliveriesFirst: true }
}

function playFault(world: World): Fault | null {
  const stuck = unplayableRoom(world)
  if (!stuck) return null
  const bricked = stuck.cause === 'deliveries'
  const reason = bricked ? 'a delivered crate bricks its own puzzle' : 'its puzzle cannot be finished from every doorway'
  return { roomId: stuck.roomId, reason, deliveriesFirst: bricked }
}

function salvageRoom(world: World, fault: Fault, rebuilt: Set<number>, refurnish: RefurnishRoom | undefined, settled: SettleResult): void {
  const { roomId, reason } = fault
  const shed = fault.deliveriesFirst ? dropDeliveriesTouching(world, roomId, reason) : 0
  if (shed > 0) {
    settled.dropped += shed
    settled.notes.push(`room ${roomId} ${reason}: dropped ${shed} of its deliveries`)
    return
  }
  const note = rebuilt.has(roomId) ? null : refurnish?.(world, roomId) ?? null
  rebuilt.add(roomId)
  if (note) {
    settled.refurnished++
    settled.notes.push(note)
    return
  }
  clearRoomPuzzle(world, roomId, reason)
  settled.cleared++
  settled.notes.push(`room ${roomId} cleared (${reason}): no fallback puzzle the proof could accept`)
}

export function worldIsProvenSolvable(world: World): boolean {
  return tryProve(world).ok
}

type Proof = { ok: true } | { ok: false; unreached: number[] }

function tryProve(world: World): Proof {
  const crates = world.crates.map((crate) => ({ ...crate }))
  let at = startPosition(world)

  for (let round = 0; round < world.rooms.length + world.deliveries.length + 2; round++) {
    if (allGoalsFilled(world, crates)) return { ok: true }
    const reach = worldReach(world, crates, at.player)
    const delivered = deliverOne(world, crates, at, reach)
    if (delivered) {
      overwrite(crates, delivered.crates)
      at = delivered.at
      continue
    }
    const visited = finishOneRoom(world, crates, reach)
    if (!visited) return { ok: false, unreached: unfinishedRooms(world, crates) }
    at = visited
  }

  const unreached = unfinishedRooms(world, crates)
  return unreached.length === 0 ? { ok: true } : { ok: false, unreached }
}

function deliverOne(world: World, crates: Crate[], at: WalkPosition, reach: WorldReach): { crates: Crate[]; at: WalkPosition } | null {
  for (const delivery of world.deliveries) {
    if (!parkedCrate(crates, delivery)) continue
    if (!delivery.path.every((roomId) => reachableCellInRoom(world, world.rooms[roomId]!, reach.cells))) continue
    const pushed = pushOneCrate(world, crates, at, delivery.parking, delivery.goal)
    if (pushed) return pushed
  }
  return null
}

function parkedCrate(crates: Crate[], delivery: WorldDelivery): Crate | undefined {
  const parked = crates.find((crate) => crate.x === delivery.parking.x && crate.y === delivery.parking.y)
  return parked && parked.color === delivery.goal.color ? parked : undefined
}

function finishOneRoom(world: World, crates: Crate[], reach: WorldReach): WalkPosition | null {
  for (const room of visitOrder(world)) {
    if (goalsFilledBy(crates, localGoals(world, room.id))) continue
    const entry = reachableCellInRoom(world, room, reach.cells)
    if (!entry) continue
    teleportLocal(world, crates, room.id)
    return { player: entry }
  }
  return null
}

function keepOnlyProvableDeliveries(world: World): number {
  const kept: WorldDelivery[] = []
  const reasons = new Map<WorldDelivery, string>()
  const crates = world.crates.map((crate) => ({ ...crate }))
  for (const room of world.rooms) teleportLocal(world, crates, room.id)
  let at = startPosition(world)
  for (const delivery of world.deliveries) {
    const pushed = tryDelivery(world, delivery, crates, kept, at, reasons)
    if (!pushed) continue
    overwrite(crates, pushed.crates)
    at = pushed.at
    kept.push(delivery)
  }
  const rejected = world.deliveries.filter((delivery) => !kept.includes(delivery))
  for (const delivery of rejected) {
    dropDelivery(world, delivery, reasons.get(delivery) ?? 'the compositional proof could not push it')
  }
  return rejected.length
}

function tryDelivery(
  world: World,
  delivery: WorldDelivery,
  crates: Crate[],
  kept: WorldDelivery[],
  at: WalkPosition,
  reasons: Map<WorldDelivery, string>,
): { crates: Crate[]; at: WalkPosition } | null {
  if (!parkedCrate(crates, delivery)) {
    reasons.set(delivery, 'no spare of the goal color was parked for it')
    return null
  }
  const pushed = pushOneCrate(world, crates, at, delivery.parking, delivery.goal)
  if (!pushed) {
    reasons.set(delivery, 'the crate could not be pushed along its lane')
    return null
  }
  const filled = kept.filter((other) => other.toRoom === delivery.toRoom).map((other) => other.goal)
  if (!importerLocalStillWorks(world, delivery, world.crates, filled)) {
    reasons.set(delivery, 'the importer could no longer finish its own puzzle around it')
    return null
  }
  return pushed
}

function ensureReachableStart(world: World): void {
  const entrance = visitOrder(world)[0]
  if (!entrance || roomEntries(world, entrance.id).length === 0) return
  if (reachesAnEntry(world, world.start)) return
  for (const cell of entrance.cells) {
    if (world.heights[index(world, cell.x, cell.y)] !== HEIGHT.Floor) continue
    if (world.crates.some((crate) => crate.x === cell.x && crate.y === cell.y)) continue
    if (!reachesAnEntry(world, cell)) continue
    world.start = { ...cell }
    return
  }
}

function reachesAnEntry(world: World, from: Vec): boolean {
  const room = roomAt(world, from.x, from.y)
  if (room < 0) return false
  const reach = worldReach(world, world.crates, from)
  return roomEntries(world, room).some((entry) => reach.cells.has(index(world, entry.x, entry.y)))
}

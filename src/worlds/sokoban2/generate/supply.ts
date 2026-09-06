import type { Rng } from '../rng'
import type { Layout } from './layout/buildLayout'
import { COLORS, type CrateColor, type Goal, type Vec } from '../types'
import type { RoomCanvas } from '../puzzle/canvas'
import type { RoomBrief2 } from './briefs'
import { routeDelivery, type LaneCell } from './deliveryLanes'

export interface SupplySpare {
  cell: Vec
  color: CrateColor
}

export interface SupplyDelivery {
  supplierId: number
  importerId: number
  parking: Vec
  goal: Goal
  color: CrateColor

  path: number[]

  lane: LaneCell[]
}

export interface SupplyPlan {
  importGoals: Map<number, Goal[]>

  exportCrates: Map<number, SupplySpare[]>
  notes: Map<number, string[]>
  deliveries: SupplyDelivery[]
}

const MAX_EXPORTS_PER_ROOM = 2

export function planSupply(layout: Layout, canvases: RoomCanvas[], briefs: RoomBrief2[], rng: Rng): SupplyPlan {
  const plan: SupplyPlan = { importGoals: new Map(), exportCrates: new Map(), notes: new Map(), deliveries: [] }
  const exportsUsed = new Array<number>(layout.rooms.length).fill(0)

  for (const roomId of layout.order) {
    const brief = briefs[roomId]
    if (brief!.imports <= 0) continue
    const delivered = supplyRoom(layout, canvases, plan, briefs, exportsUsed, roomId, rng)
    if (delivered < brief!.imports) {
      note(plan, roomId, `wanted ${brief!.imports} imported crates, could only route ${delivered}`)
      brief!.imports = delivered
      brief!.crateCount += 1
    }
  }
  return plan
}

function supplyRoom(
  layout: Layout,
  canvases: RoomCanvas[],
  plan: SupplyPlan,
  briefs: RoomBrief2[],
  exportsUsed: number[],
  roomId: number,
  rng: Rng,
): number {
  let delivered = 0
  for (let slot = 0; slot < briefs[roomId]!.imports; slot++) {
    const supplier = findSupplier(layout, briefs, exportsUsed, roomId)
    if (supplier === null) return delivered
    const path = shortestRoomPath(layout, supplier, roomId)
    if (!path) return delivered
    const color = deliveryColor(briefs, supplier, roomId, slot, plan.deliveries.length)
    if (!recordDelivery(layout, canvases, plan, path, color, rng)) return delivered
    exportsUsed[supplier]!++
    delivered++
    noteTheHop(plan, roomId, supplier, color, path.length - 1)
  }
  return delivered
}

function recordDelivery(
  layout: Layout,
  canvases: RoomCanvas[],
  plan: SupplyPlan,
  path: number[],
  color: CrateColor,
  rng: Rng,
): boolean {
  const supplierId = path[0]
  const importerId = path[path.length - 1]
  const parked = (plan.exportCrates.get(supplierId!) ?? []).map((spare) => spare.cell)
  const route = routeDelivery(layout, canvases, path, color, parked, plan.importGoals.get(importerId!) ?? [], rng)
  if (!route) return false
  plan.exportCrates.set(supplierId!, [...(plan.exportCrates.get(supplierId!) ?? []), { cell: route.parking, color }])
  plan.importGoals.set(importerId!, [...(plan.importGoals.get(importerId!) ?? []), route.goal])
  plan.deliveries.push({ supplierId: supplierId!, importerId: importerId!, parking: route.parking, goal: route.goal, color, path: [...path], lane: route.lane })
  return true
}

function noteTheHop(plan: SupplyPlan, importerId: number, supplierId: number, color: CrateColor, hops: number): void {
  note(plan, importerId, `imports a ${color} crate from room ${supplierId}, ${hops} ${hops === 1 ? 'door' : 'doors'} away`)
  note(plan, supplierId, `parks a ${color} spare for room ${importerId}`)
}

export function note(plan: SupplyPlan, roomId: number, text: string): void {
  plan.notes.set(roomId, [...(plan.notes.get(roomId) ?? []), text])
}

function deliveryColor(
  briefs: RoomBrief2[],
  supplierId: number,
  importerId: number,
  importIndex: number,
  deliveryIndex: number,
): CrateColor {
  const wanted = briefs[importerId]!.importColors?.[importIndex]
  if (wanted) return wanted
  return freeColor(briefs[supplierId]!.localColors) ?? freeColor(briefs[importerId]!.localColors) ?? COLORS[deliveryIndex % COLORS.length]!
}

function freeColor(local: CrateColor[] | undefined): CrateColor | undefined {
  if (!local || local.length === 0) return undefined
  return COLORS.find((color) => !local.includes(color))
}

function findSupplier(layout: Layout, briefs: RoomBrief2[], exportsUsed: number[], importerId: number): number | null {
  const importerDepth = layout.rooms[importerId]!.depth
  const candidates = layout.rooms.filter(
    (room) =>
      room.id !== importerId &&
      room.depth < importerDepth &&
      briefs[room.id]!.imports === 0 &&
      exportsUsed[room.id]! < MAX_EXPORTS_PER_ROOM,
  )
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.depth - a.depth || a.id - b.id)
  return candidates[0]!.id
}

function shortestRoomPath(layout: Layout, from: number, to: number): number[] | null {
  const previous = new Map<number, number>([[from, -1]])
  const queue = [from]
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head]
    if (id === to) break
    for (const next of layout.neighbors[id!]!) {
      if (previous.has(next)) continue
      previous.set(next, id!)
      queue.push(next)
    }
  }
  if (!previous.has(to)) return null
  const path: number[] = []
  for (let id = to; id !== -1; id = previous.get(id)!) path.unshift(id)
  return path
}

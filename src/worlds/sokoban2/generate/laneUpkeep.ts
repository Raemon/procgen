import type { Crate, RoomPlan, Vec } from '../types'
import { toWorld } from '../world'
import { isFloor, type RoomCanvas } from '../puzzle/canvas'
import { stillFloor } from './deliveryLanes'
import { note, type SupplyDelivery, type SupplyPlan } from './supply'

const LANE_BROKEN = 'dropped an import whose lane the furnished terrain no longer clears'

export function dropDeliveriesOffTheirLanes(
  canvases: RoomCanvas[],
  rooms: RoomPlan[],
  crates: Crate[],
  plan: SupplyPlan,
): number {
  const broken = plan.deliveries.filter((delivery) => !laneIsClear(canvases, delivery))
  for (const delivery of broken) forget(rooms, crates, plan, delivery)
  return broken.length
}

function laneIsClear(canvases: RoomCanvas[], delivery: SupplyDelivery): boolean {
  if (!isFloor(canvases[delivery.supplierId]!, delivery.parking)) return false
  if (!isFloor(canvases[delivery.importerId]!, delivery.goal)) return false
  return delivery.lane.every((step) => stillFloor(canvases[step.roomId]!, step.cell))
}

function forget(rooms: RoomPlan[], crates: Crate[], plan: SupplyPlan, delivery: SupplyDelivery): void {
  forgetInPlan(plan, delivery)
  forgetOnImporter(rooms[delivery.importerId]!, delivery.goal)
  forgetOnSupplier(rooms[delivery.supplierId]!, crates, delivery.parking)
  note(plan, delivery.importerId, LANE_BROKEN)
}

function forgetInPlan(plan: SupplyPlan, delivery: SupplyDelivery): void {
  plan.deliveries = plan.deliveries.filter((other) => other !== delivery)
  const goals = plan.importGoals.get(delivery.importerId) ?? []
  plan.importGoals.set(delivery.importerId, goals.filter((goal) => goal !== delivery.goal))
  const spares = plan.exportCrates.get(delivery.supplierId) ?? []
  plan.exportCrates.set(delivery.supplierId, spares.filter((spare) => spare.cell !== delivery.parking))
}

function forgetOnImporter(importer: RoomPlan, localGoal: Vec): void {
  const drop = toWorld(importer, localGoal)
  importer.goals = importer.goals.filter((goal) => !(goal.x === drop.x && goal.y === drop.y))
  importer.imports = Math.max(0, importer.imports - 1)
  importer.notes = [...importer.notes, LANE_BROKEN]
}

function forgetOnSupplier(supplier: RoomPlan, crates: Crate[], localParking: Vec): void {
  supplier.exports = Math.max(0, supplier.exports - 1)
  const parked = toWorld(supplier, localParking)
  const spare = crates.findIndex((crate) => crate.x === parked.x && crate.y === parked.y)
  if (spare >= 0) crates.splice(spare, 1)
}

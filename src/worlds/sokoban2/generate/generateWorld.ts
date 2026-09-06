import { derive } from '../rng'
import { buildLayout, type Layout } from './layout/buildLayout'
import type { GenParams } from '../params'
import type { World } from '../types'
import { openDoorways } from './openDoorways'
import { planCurriculum, replanRoutelessImports, summariseCurriculum, syllabusLine } from './planCurriculum'
import { planSupply } from './supply'
import { dropDeliveriesOffTheirLanes } from './laneUpkeep'
import { furnishRooms } from './furnishRooms'
import { summariseFurnish } from './describeRoom'
import { deliveriesOnTheMap, paintWorld } from './paintWorld'
import { placePlayer } from './placePlayer'
import { settleWorld } from './prove'
import { colorTally, tallyWorld } from './tallyWorld'

export type GenerateProgress = (fraction: number, stage: string) => void

export function generateWorld2(params: GenParams, seed: number, onProgress?: GenerateProgress): World {
  const startedAt = performance.now()
  const trace: string[] = []

  const layout = buildLayout(params, derive(seed, 'layout'))
  const slotSizes = layout.rooms.map((room) => room.slots.length).sort((a, b) => a - b)
  trace.push(`layout: ${layout.rooms.length} rooms (${slotSizes.join('+')} slots), ${layout.doors.length} doors, depth ${layout.maxDepth}`)

  const canvases = openDoorways(layout)
  const lessons = planCurriculum(layout, params, derive(seed, 'curriculum'))
  const supply = planSupply(layout, canvases, lessons.map((lesson) => lesson.brief), derive(seed, 'supply'))
  const replanned = replanRoutelessImports(lessons, layout, params)
  for (const roomId of replanned) {
    const said = supply.notes.get(roomId) ?? []
    supply.notes.set(roomId, [...said, `no import could be routed here; re-planned as a ${lessons[roomId]!.recipe} puzzle`])
  }
  const briefs = lessons.map((lesson) => lesson.brief)
  trace.push(`curriculum: ${summariseCurriculum(lessons)} (crossRoomChance ${params.crossRoomChance})`)
  trace.push(`syllabus: ${syllabusLine(lessons, layout)}`)
  trace.push(
    `supply: ${supply.deliveries.length} deliveries into ${supply.importGoals.size} rooms from ${supply.exportCrates.size} suppliers` +
      (replanned.length > 0 ? `, ${replanned.length} routeless docks re-planned as local puzzles` : ''),
  )
  trace.push(`reach: ${enterableSummary(layout)}`)
  onProgress?.(0.25, 'planning the maze')

  const furnished = furnishRooms(layout, canvases, briefs, supply, seed, (done, total) =>
    onProgress?.(0.25 + 0.45 * (done / total), 'furnishing the rooms'),
    lessons.map((lesson) => lesson.localRecipe),
  )
  const offLane = dropDeliveriesOffTheirLanes(canvases, furnished.rooms, furnished.crates, supply)
  trace.push(`furnish: ${summariseFurnish(furnished.rooms)}, ${furnished.retries} retries${offLane > 0 ? `, ${offLane} lanes built over` : ''}`)
  trace.push(`ramp: ${furnished.ramp}`)
  onProgress?.(0.7, 'painting the map')

  const world = paintWorld(layout, canvases, furnished.rooms, furnished.crates, seed, trace)
  world.start = placePlayer(world, layout, derive(seed, 'start'))
  world.deliveries = deliveriesOnTheMap(supply, furnished.rooms)
  onProgress?.(0.85, 'proving it can be finished')

  const settled = settleWorld(world, furnished.refurnishRoom)
  trace.push(
    `prove: ${world.deliveries.length} deliveries hold, dropped ${settled.dropped}, ` +
      `refurnished ${settled.refurnished}, cleared ${settled.cleared} rooms`,
  )
  for (const note of settled.notes) trace.push(`  settle: ${note}`)

  world.stats = tallyWorld(world, layout.maxDepth, startedAt, furnished.retries)
  trace.push(`build: ${world.stats.crates} crates for ${world.stats.goals} goals (${colorTally(world)}), ${world.stats.ledgeRooms} ledge rooms`)
  onProgress?.(1, 'built')
  return world
}

function enterableSummary(layout: Layout): string {
  const blocked = unenterableRooms(layout)
  const enterable = layout.rooms.length - blocked.length
  return blocked.length === 0
    ? `all ${enterable} rooms enterable in curriculum order`
    : `${enterable}/${layout.rooms.length} rooms enterable; ${blocked.join(', ')} sit behind no finished room`
}

function unenterableRooms(layout: Layout): number[] {
  const entered = new Set<number>(layout.order.slice(0, 1))
  const blocked: number[] = []
  for (const roomId of layout.order.slice(1)) {
    if (layout.neighbors[roomId]!.some((neighbor) => entered.has(neighbor))) entered.add(roomId)
    else blocked.push(roomId)
  }
  return blocked
}

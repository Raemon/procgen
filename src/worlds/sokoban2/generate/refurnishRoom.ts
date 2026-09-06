import { derive } from '../rng'
import { HEIGHT, type RoomPlan, type Vec, type World } from '../types'
import { index, roomAt, toWorld } from '../world'
import { at, ledgeCells, type Rect, type RoomCanvas } from '../puzzle/canvas'
import { finalise, type Furnishing } from './appraise'
import type { RoomBrief2 } from './briefs'
import { recordCertificate } from './certificates'
import { canvasCellsWithIds, localGoal, worldCrate, type CrateIds } from './describeRoom'
import { allGoals } from './paintWorld'
import { RECIPES, type RecipeId } from './recipes'
import { searchRoomPuzzle } from './searchRoomPuzzle'
import { briefForRung, rungsBelow, type Rung } from './recipeLadder'

export type RefurnishRoom = (world: World, roomId: number) => string | null

const FALLBACK_ATTEMPTS = 8
const ROOM_NODE_METER = 16000

export interface RebuildContext {
  canvases: RoomCanvas[]
  briefs: RoomBrief2[]
  bays: (Rect | null)[]
  built: RecipeId[]
  claimed: Set<string>

  ledger: Map<string, number>
  seed: number
  ids: CrateIds
}

export function refurnisher(ctx: RebuildContext): RefurnishRoom {
  return (world, roomId) => {
    const room = world.rooms[roomId]
    const fallback = rebuildRecipe(ctx.built[roomId]!, ctx.briefs[roomId]!, ctx.ledger)
    if (!fallback) return null
    ctx.claimed.delete(room!.concept)
    const rebuilt = rebuildOnce(ctx, roomId, fallback, parkedCells(world, ctx.canvases[roomId]!, room!))
    if (!rebuilt) return null
    ctx.claimed.add(rebuilt.concept)
    ctx.ledger.set(rebuilt.motif, Math.max(ctx.ledger.get(rebuilt.motif) ?? 0, rebuilt.trapCredit))
    ctx.built[roomId] = rebuilt.recipeId
    recordCertificate(roomId, rebuilt.recipeId, rebuilt)
    restampRoom(world, ctx.canvases[roomId]!, room!, rebuilt, ctx.ids)
    return `room ${roomId} refurnished as ${rebuilt.motif} instead of being cleared`
  }
}

function parkedCells(world: World, canvas: RoomCanvas, room: RoomPlan): number[] {
  return world.deliveries
    .filter((delivery) => delivery.fromRoom === room.id)
    .map((delivery) => at(canvas, delivery.parking.x - room.x, delivery.parking.y - room.y))
}

function rebuildOnce(ctx: RebuildContext, roomId: number, fallback: Rung, parked: number[]): Furnishing | null {
  const brief = briefForRung(ctx.briefs[roomId]!, fallback)
  const meter = { roomRemaining: ROOM_NODE_METER, world: { remaining: ROOM_NODE_METER } }
  const rng = derive(ctx.seed, `refurnish:${roomId}`)
  const chosen = searchRoomPuzzle(
    ctx.canvases[roomId]!, fallback.recipe, brief, FALLBACK_ATTEMPTS, rng, ctx.claimed, meter, () => {}, ctx.bays[roomId]!, ctx.ledger, parked,
  )
  if (!chosen) return null
  const rebuilt = finalise(chosen, brief)
  ctx.canvases[roomId]!.height.set(rebuilt.terrain)
  return rebuilt
}

function rebuildRecipe(built: RecipeId, brief: RoomBrief2, ledger: Map<string, number>): Rung | null {
  const simpler = rungsBelow(RECIPES[built], brief, ledger)[0]
  if (simpler) return simpler
  return built === 'R0' ? null : { recipe: RECIPES.R0, shape: null }
}

function restampRoom(world: World, canvas: RoomCanvas, room: RoomPlan, rebuilt: Furnishing, ids: CrateIds): void {
  restampTerrain(world, canvas, room)
  world.crates = [...cratesToKeep(world, room), ...rebuilt.draft.crates.map((crate) => worldCrate(room, rebuilt.board, crate, ids))]
  room.goals = [...rebuilt.draft.goals.map((goal) => localGoal(room, goal)), ...importedGoals(world, room)]
  room.concept = rebuilt.concept
  room.motif = rebuilt.motif
  room.pullDepth = rebuilt.draft.pulls
  room.minPushes = rebuilt.minPushes
  room.boxLines = rebuilt.metrics.boxLines
  room.traps = rebuilt.trapCredit
  room.ledges = ledgeCells(canvas).map((cell) => toWorld(room, cell))
  room.notes = [...room.notes, ...rebuilt.notes, 'refurnished in world context rather than cleared']
  world.goals = allGoals(world.rooms)
}

function restampTerrain(world: World, canvas: RoomCanvas, room: RoomPlan): void {
  for (const { local, localId } of canvasCellsWithIds(canvas)) {
    const id = index(world, room.x + local.x, room.y + local.y)
    world.heights[id]! = canvas.height[localId]!
    world.roomIds[id] = canvas.height[localId]! <= HEIGHT.Ledge ? room.id : -1
  }
}

function cratesToKeep(world: World, room: RoomPlan) {
  const parked = new Set(
    world.deliveries.filter((delivery) => delivery.fromRoom === room.id).map((delivery) => cellKey(delivery.parking)),
  )
  return world.crates.filter((crate) => roomAt(world, crate.x, crate.y) !== room.id || parked.has(cellKey(crate)))
}

function importedGoals(world: World, room: RoomPlan) {
  return room.goals.filter((goal) =>
    world.deliveries.some((delivery) => delivery.toRoom === room.id && cellKey(delivery.goal) === cellKey(goal)),
  )
}

function cellKey(cell: Vec): string {
  return `${cell.x},${cell.y}`
}

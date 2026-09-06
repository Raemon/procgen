import { derive, type Rng } from '../rng'
import type { Layout } from './layout'
import { toWorld } from '../world'
import type { Crate, RoomPlan } from '../types'
import { at, clearTerrain, type Rect, type RoomCanvas } from '../puzzle/canvas'
import { finalise, type Appraisal, type Furnishing } from './appraise'
import type { RoomBrief2 } from './briefs'
import { recordCertificate } from './certificates'
import { describeRoom, worldCrate, type CrateIds } from './describeRoom'
import { exhausted, type NodeMeter } from './nodeMeter'
import { chooseBay } from './puzzleBay'
import { textureRoom } from './raiseTerrain'
import { briefForRung, localRecipeFor, rungsBelow, type Rung } from './recipeLadder'
import { recipeOf, type Recipe, type RecipeId } from './recipes'
import { refurnisher, type RebuildContext, type RefurnishRoom } from './refurnishRoom'
import { searchRoomPuzzle } from './searchRoomPuzzle'
import type { SupplyPlan } from './supply'

export interface FurnishedWorld {
  rooms: RoomPlan[]
  crates: Crate[]
  retries: number

  ramp: string
  refurnishRoom: RefurnishRoom
}

const ATTEMPTS_PER_ROOM = 16
const FALLBACK_ATTEMPTS = 8

const FALLBACK_DEPTH = 3

const WORLD_NODE_METER = 180000
const ROOM_NODE_METER = 24000

const TOP_RUNG_SHARE = 0.55

const TRAP_CAP = 4

export function furnishRooms(
  layout: Layout,
  canvases: RoomCanvas[],
  briefs: RoomBrief2[],
  supply: SupplyPlan,
  seed: number,
  onRoomDone?: (done: number, total: number) => void,
  localRecipes?: RecipeId[],
): FurnishedWorld {
  const rooms: RoomPlan[] = new Array(layout.rooms.length)
  const crates: Crate[] = []
  const claimed = new Set<string>()
  const ledger = new Map<string, number>()
  const world = { remaining: WORLD_NODE_METER }
  const bays = canvases.map(chooseBay)
  const built: RecipeId[] = briefs.map((brief, roomId) => localRecipeFor(brief, localRecipes?.[roomId]).id)
  const ids: CrateIds = { next: 0 }
  const tally = { retries: 0, done: 0 }
  const ramp = { last: 0, steps: [] as string[] }

  for (const [placed, roomId] of layout.order.entries()) {
    const meter = { roomRemaining: roomShare(world, layout.order.length - placed), world }
    const rng = derive(seed, `traproom:${roomId}`)
    const local = localRecipeFor(briefs[roomId]!, localRecipes?.[roomId])
    briefs[roomId] = nextStep(briefs[roomId]!, ramp.last)
    const parked = parkingCells(canvases[roomId]!, supply, roomId)
    const chosen = furnishOne(canvases[roomId]!, briefs[roomId], local, rng, claimed, meter, () => tally.retries++, bays[roomId]!, ledger, parked)
    const shipped = chosen ? finalise(chosen, briefs[roomId]) : null
    if (shipped) bankStep(shipped, briefs[roomId], ledger, ramp)
    else ramp.steps.push('-')
    settleRoom(layout, canvases, briefs, supply, rooms, crates, ids, claimed, built, roomId, rng, shipped)
    onRoomDone?.(++tally.done, layout.order.length)
  }
  const rebuild: RebuildContext = { canvases, briefs, bays, built, claimed, ledger, seed, ids }
  return { rooms, crates, retries: tally.retries, ramp: ramp.steps.join(' '), refurnishRoom: refurnisher(rebuild) }
}

function nextStep(brief: RoomBrief2, lastTraps: number): RoomBrief2 {
  if (brief.crateCount <= 1) return brief
  return { ...brief, trapTarget: Math.min(TRAP_CAP, Math.max(brief.trapTarget, lastTraps + 1)) }
}

function bankStep(shipped: Furnishing, brief: RoomBrief2, ledger: Map<string, number>, ramp: { last: number; steps: string[] }): void {
  const taught = ledger.get(shipped.motif)
  ledger.set(shipped.motif, Math.max(taught ?? 0, shipped.trapCredit))
  if (taught !== undefined) shipped.notes.push(`repeats a lesson already taught with ${taught} traps, so it banks ${shipped.trapCredit}`)
  const short = shipped.trapCredit < brief.trapTarget
  shipped.notes.push(`ramp: aimed at ${brief.trapTarget} traps after the room before, banked ${shipped.trapCredit}`)
  ramp.steps.push(short ? `${shipped.trapCredit}(aimed ${brief.trapTarget})` : `${shipped.trapCredit}`)
  ramp.last = shipped.trapCredit
}

function settleRoom(
  layout: Layout,
  canvases: RoomCanvas[],
  briefs: RoomBrief2[],
  supply: SupplyPlan,
  rooms: RoomPlan[],
  crates: Crate[],
  ids: CrateIds,
  claimed: Set<string>,
  built: RecipeId[],
  roomId: number,
  rng: Rng,
  shipped: Furnishing | null,
): void {
  const room = layout.rooms[roomId]
  const canvas = canvases[roomId]
  const brief = briefs[roomId]
  if (shipped) {
    canvas!.height.set(shipped.terrain)
    claimed.add(shipped.concept)
    recordCertificate(roomId, shipped.recipeId, shipped)
    built[roomId] = shipped.recipeId
    for (const crate of shipped.draft.crates) crates.push(worldCrate(room!, shipped.board, crate, ids))
  } else {
    clearTerrain(canvas!)
    textureRoom(canvas!, recipeOf(brief!.recipeId), null, brief!.obstacleDensity, null, rng)
  }
  for (const spare of supply.exportCrates.get(roomId) ?? []) {
    const cell = toWorld(room!, spare.cell)
    crates.push({ id: ids.next++, x: cell.x, y: cell.y, color: spare.color })
  }
  rooms[roomId] = describeRoom(room!, canvas!, brief!, supply, shipped)
}

function roomShare(world: { remaining: number }, roomsLeft: number): number {
  return Math.min(ROOM_NODE_METER, Math.max(1, Math.floor(world.remaining / Math.max(1, roomsLeft))))
}

function furnishOne(
  canvas: RoomCanvas,
  brief: RoomBrief2,
  local: Recipe,
  rng: Rng,
  claimed: Set<string>,
  meter: NodeMeter,
  onRetry: () => void,
  bay: Rect | null,
  ledger: Map<string, number>,
  parked: number[],
): Appraisal | null {
  if (brief.crateCount === 0) return null
  const rungs: Rung[] = [{ recipe: local, shape: brief.shape ?? null }, ...rungsBelow(local, brief, ledger).slice(0, FALLBACK_DEPTH)]
  for (const [step, rung] of rungs.entries()) {
    if (step > 0 && exhausted(meter)) return null
    const attempts = step === 0 ? ATTEMPTS_PER_ROOM : FALLBACK_ATTEMPTS
    const asked = briefForRung(brief, rung)
    const found = onRung(meter, step === 0, (share) =>
      searchRoomPuzzle(canvas, rung.recipe, asked, attempts, rng, claimed, share, onRetry, bay, ledger, parked),
    )
    if (found) return noteHowItGotHere(found, brief)
  }
  return null
}

export function parkingCells(canvas: RoomCanvas, supply: SupplyPlan, roomId: number): number[] {
  return (supply.exportCrates.get(roomId) ?? []).map((spare) => at(canvas, spare.cell.x, spare.cell.y))
}

function noteHowItGotHere(found: Appraisal, brief: RoomBrief2): Appraisal {
  const dock = recipeOf(brief.recipeId).kind === 'import'
  if (dock) found.notes.push(`import dock: ${brief.imports} delivered goal(s) over a certified ${found.recipeId} puzzle`)
  else if (found.recipeId !== brief.recipeId) found.notes.push(`fell back to ${found.recipeId}: ${brief.recipeId} never certified here`)
  return found
}

function onRung(meter: NodeMeter, top: boolean, run: (rung: NodeMeter) => Appraisal | null): Appraisal | null {
  const share = top ? Math.floor(meter.roomRemaining * TOP_RUNG_SHARE) : meter.roomRemaining
  const rung: NodeMeter = { roomRemaining: share, world: meter.world }
  const found = run(rung)
  meter.roomRemaining -= share - rung.roomRemaining
  return found
}

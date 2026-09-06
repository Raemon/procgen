import type { Crate, CrateColor, Goal, RoomPlan, RoomRect, Vec } from '../types'
import { toWorld } from '../world'
import { at, canvasCells, channelCells, ledgeCells, type RoomCanvas } from '../puzzle/canvas'
import { vecOf, type Board } from '../puzzle/board'
import type { Furnishing } from './appraise'
import { MIN_ROOM_TRAPS } from './trapCredit'
import type { RoomBrief2 } from './briefs'
import type { SupplyPlan } from './supply'

export interface CrateIds {
  next: number
}

export function describeRoom(
  room: RoomRect,
  canvas: RoomCanvas,
  brief: RoomBrief2,
  supply: SupplyPlan,
  built: Furnishing | null,
): RoomPlan {
  const imported = supply.importGoals.get(room.id) ?? []
  const local = built ? built.draft.goals.map((goal) => localGoal(room, goal)) : []
  return {
    ...room,
    recipeId: brief.recipeId === 'R6' ? 'R6' : built ? built.recipeId : brief.recipeId,
    concept: built ? built.concept : brief.imports > 0 ? 'import-dock' : 'empty',
    motif: built ? built.motif : 'none',
    trapTarget: brief.trapTarget,
    tier: brief.tier,
    imports: imported.length,
    exports: (supply.exportCrates.get(room.id) ?? []).length,
    goals: [...local, ...imported.map((goal) => localGoal(room, goal))],
    ledges: ledgeCells(canvas).map((cell) => toWorld(room, cell)),
    pullDepth: built ? built.draft.pulls : 0,
    minPushes: built ? built.minPushes : null,
    boxLines: built ? built.metrics.boxLines : null,
    traps: built ? built.trapCredit : null,
    highway: [...channelCells(canvas)].map((id) => toWorld(room, cellOfCanvas(canvas, id))),
    notes: [...(supply.notes.get(room.id) ?? []), ...(built ? built.notes : [emptyReason(brief)])],
  }
}

function cellOfCanvas(canvas: RoomCanvas, id: number): Vec {
  return { x: id % canvas.w, y: Math.floor(id / canvas.w) }
}

function emptyReason(brief: RoomBrief2): string {
  if (brief.crateCount === 0) return 'crate-free room by design'
  return `no ${brief.recipeId} puzzle (nor a simpler one) with ${MIN_ROOM_TRAPS} certified traps fit here; left as an empty corridor`
}

export function localGoal(room: RoomRect, goal: Goal): Goal {
  const cell = toWorld(room, goal)
  return { x: cell.x, y: cell.y, color: goal.color }
}

export function worldCrate(room: RoomRect, board: Board, crate: { cell: number; color: CrateColor }, ids: CrateIds): Crate {
  const cell = toWorld(room, vecOf(board, crate.cell))
  return { id: ids.next++, x: cell.x, y: cell.y, color: crate.color }
}

export function canvasCellsWithIds(canvas: RoomCanvas): { local: Vec; localId: number }[] {
  return canvasCells(canvas)
    .map((local) => ({ local, localId: at(canvas, local.x, local.y) }))
    .filter((cell) => !canvas.outside[cell.localId])
}

export function summariseFurnish(rooms: RoomPlan[]): string {
  const counts = new Map<string, number>()
  let empty = 0
  for (const room of rooms) {
    if (room.traps === null) empty++
    else counts.set(room.recipeId, (counts.get(room.recipeId) ?? 0) + 1)
  }
  const shipped = [...counts].sort().map(([id, count]) => `${count}x ${id}`).join(', ')
  return `${shipped || 'no puzzle rooms'}${empty > 0 ? `, ${empty} empty` : ''}`
}

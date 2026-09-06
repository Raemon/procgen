import { Rng } from '../rng'
import { HEIGHT, type Vec } from '../types'
import {
  allHoldableConnected,
  at,
  cellsOutsideRect,
  channelCells,
  clearTerrain,
  floorComponents,
  inRoomCount,
  inside,
  isFloor,
  isReserved,
  maskCells,
  rectCells,
  scatterPillars,
  scatterSegments,
  unmaskCells,
  type Accept,
  type Rect,
  type RoomCanvas,
} from '../puzzle/canvas'
import { analyseLedge, ledgeHealth, placeLedge, type LedgePlacement } from '../puzzle/ledges'
import type { LedgeShape } from '../puzzle/ledgeShapes'
import type { RoomBrief2 } from './briefs'
import { needsLedge, type Recipe } from './recipes'

export type TerrainAttempt = LedgePlacement | null | 'failed' | 'noFloors'

const OBSTACLE_BUMP_PER_ATTEMPT = 0.02
const OBSTACLE_BUMP_ATTEMPTS = 5

const OBSTACLE_BUMP_CAP = 0.1

const SEGMENT_SHARE = 0.7
const CORRIDOR_DENSITY = 0.07

const LEDGE_WORKING_CELLS = 2

const PLANNED_SHAPE_ATTEMPTS = 8

const LEDGE_TOP_RUN = 3

export function plannedShape(recipe: Recipe, brief: RoomBrief2, attempt: number): LedgeShape | null {
  if (!needsLedge(recipe)) return null
  if (brief.shape && attempt < PLANNED_SHAPE_ATTEMPTS && recipe.shapes.includes(brief.shape)) return brief.shape
  return recipe.shapes[attempt % recipe.shapes.length]!
}

export function raiseTerrain(
  canvas: RoomCanvas,
  recipe: Recipe,
  shape: LedgeShape | null,
  brief: RoomBrief2,
  attempt: number,
  rng: Rng,
  bay: Rect | null,
): TerrainAttempt {
  clearTerrain(canvas)
  const masked = bay ? maskCells(canvas, cellsOutsideRect(canvas, bay)) : []
  const placement = shape ? placeLedge(canvas, shape, rng, recipe.script === 'ledgeTop' ? LEDGE_TOP_RUN : 1) : null
  if (shape && !placement) {
    unmaskCells(canvas, masked)
    return 'failed'
  }
  textureRoom(canvas, recipe, placement, brief.obstacleDensity + densityBump(attempt), bay, rng)
  unmaskCells(canvas, masked)
  if (bay) {
    fenceBay(canvas, recipe, placement, bay)
    textureCorridor(canvas, recipe, placement, bay, rng)
  }
  if (!floorsHold(canvas, recipe)) return 'noFloors'
  if (!shape || !placement) return placement
  return analyseLedge(canvas, shape, placement.cells, rng) ?? 'noFloors'
}

function densityBump(attempt: number): number {
  return Math.min(OBSTACLE_BUMP_CAP, (attempt % (OBSTACLE_BUMP_ATTEMPTS + 1)) * OBSTACLE_BUMP_PER_ATTEMPT)
}

export function textureRoom(
  canvas: RoomCanvas,
  recipe: Recipe,
  placement: LedgePlacement | null,
  density: number,
  bay: Rect | null,
  rng: Rng,
): number {
  const area = bay ? rectCells(canvas, bay).length : inRoomCount(canvas)
  const target = Math.floor(area * density)
  const accept = keeper(canvas, recipe, placement)
  const placed = scatterSegments(canvas, Math.round(target * SEGMENT_SHARE), rng, accept)
  return placed + scatterPillars(canvas, target - placed, rng, accept)
}

function fenceBay(canvas: RoomCanvas, recipe: Recipe, placement: LedgePlacement | null, bay: Rect): number {
  const accept = keeper(canvas, recipe, placement)
  let placed = 0
  for (const cell of bayRing(canvas, bay)) {
    if (!isFloor(canvas, cell) || isReserved(canvas, cell) || canvas.channel[at(canvas, cell.x, cell.y)]) continue
    const id = at(canvas, cell.x, cell.y)
    canvas.height[id] = HEIGHT.Wall
    if (accept()) placed++
    else canvas.height[id] = HEIGHT.Floor
  }
  return placed
}

function bayRing(canvas: RoomCanvas, bay: Rect): Vec[] {
  const ring: Vec[] = []
  for (let y = bay.y - 1; y <= bay.y + bay.h; y++) {
    for (let x = bay.x - 1; x <= bay.x + bay.w; x++) {
      const onRing = x === bay.x - 1 || x === bay.x + bay.w || y === bay.y - 1 || y === bay.y + bay.h
      if (onRing && inside(canvas, { x, y }) && !canvas.outside[at(canvas, x, y)]) ring.push({ x, y })
    }
  }
  const nearestDoor = (cell: Vec) => Math.min(...canvas.entries.map((entry) => Math.abs(entry.x - cell.x) + Math.abs(entry.y - cell.y)), 0)
  return ring.sort((a, b) => nearestDoor(b) - nearestDoor(a))
}

function textureCorridor(canvas: RoomCanvas, recipe: Recipe, placement: LedgePlacement | null, bay: Rect, rng: Rng): number {
  const corridor = cellsOutsideRect(canvas, bay)
  const masked = maskCells(canvas, rectCells(canvas, bay))
  const placed = scatterSegments(canvas, Math.floor(CORRIDOR_DENSITY * corridor.length), rng, keeper(canvas, recipe, placement))
  unmaskCells(canvas, masked)
  return placed
}

function keeper(canvas: RoomCanvas, recipe: Recipe, placement: LedgePlacement | null): Accept {
  if (!placement) return () => allHoldableConnected(canvas) && floorsHold(canvas, recipe)
  const want = wantedHealth(canvas, placement)
  return () => {
    const health = ledgeHealth(canvas, placement.cells)
    if (health.landings < want.landings || health.stairs < want.stairs) return false
    return allHoldableConnected(canvas) && floorsHold(canvas, recipe)
  }
}

function wantedHealth(canvas: RoomCanvas, placement: LedgePlacement): { landings: number; stairs: number } {
  const health = ledgeHealth(canvas, placement.cells)
  return { landings: Math.min(LEDGE_WORKING_CELLS, health.landings), stairs: Math.min(LEDGE_WORKING_CELLS, health.stairs) }
}

function floorsHold(canvas: RoomCanvas, recipe: Recipe): boolean {
  const groups = floorComponents(canvas)
  if (groups.length !== (recipe.id === 'R4' ? 2 : 1)) return false
  const anchors = [...canvas.entries.map((entry) => at(canvas, entry.x, entry.y)), ...channelCells(canvas)]
  return groups.some((group) => anchors.every((id) => group.has(id)))
}

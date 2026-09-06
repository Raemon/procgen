import {
  HEIGHT,
  TILE,
  type Crate,
  type CrateColor,
  type Door,
  type Goal,
  type RoomPlan,
  type Vec,
  type World,
} from '../../types'
import { index } from '../../world'
import { bindDoor } from '../../generate/layout/doorGraph'

export interface AsciiOptions {
  overlay?: string[]
  rooms?: (x: number, y: number) => number
  depths?: number[] | ((roomId: number) => number)
  seed?: number
}

interface Paint {
  tile: number
  terrain: number
  crate?: CrateColor
  goal?: CrateColor
  start?: boolean
}

const GROUND = { tile: TILE.Ground, terrain: HEIGHT.Floor }
const LEDGE = { tile: TILE.Ground, terrain: HEIGHT.Ledge }

const LEGEND: Record<string, Paint> = {
  '#': { tile: TILE.Ground, terrain: HEIGHT.Wall },
  '.': { ...GROUND },
  '=': { ...LEDGE },
  D: { tile: TILE.Door, terrain: HEIGHT.Floor },
  '@': { ...GROUND, start: true },
  r: { ...GROUND, crate: 'red' },
  b: { ...GROUND, crate: 'blue' },
  R: { ...GROUND, goal: 'red' },
  B: { ...GROUND, goal: 'blue' },
  '%': { ...LEDGE, crate: 'red' },
  '&': { ...LEDGE, crate: 'blue' },
  ' ': { tile: TILE.Void, terrain: HEIGHT.Floor },
}

function paintAt(rows: string[], x: number, y: number): Paint {
  const char = rows[y]?.[x] ?? ' '
  const paint = LEGEND[char]
  if (!paint) throw new Error(`ascii: unknown character '${char}' at ${x},${y}`)
  return paint
}

export function worldFromAscii(rows: string[], options: AsciiOptions = {}): World {
  const height = rows.length
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const tiles = new Uint8Array(width * height)
  const heights = new Uint8Array(width * height)
  const roomIds = new Int16Array(width * height).fill(-1)
  const crates: Crate[] = []
  const goals: Goal[] = []
  const size = { width, height }
  let start: Vec | null = null

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const base = paintAt(rows, x, y)
      const id = index(size, x, y)
      tiles[id] = base.tile
      heights[id] = base.terrain
      for (const paint of options.overlay ? [base, paintAt(options.overlay, x, y)] : [base]) {
        if (paint.crate) crates.push({ id: crates.length, x, y, color: paint.crate })
        if (paint.goal) goals.push({ x, y, color: paint.goal })
        if (paint.start) start = { x, y }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = index(size, x, y)
      if (tiles[id] !== TILE.Ground || heights[id]! > HEIGHT.Ledge) continue
      roomIds[id] = options.rooms ? options.rooms(x, y) : 0
    }
  }

  const rooms = roomPlans({ ...size, roomIds, heights, goals }, options)
  return {
    seed: options.seed ?? 0,
    width,
    height,
    tiles,
    heights,
    roomIds,
    rooms,
    doors: doorsFrom({ ...size, tiles, roomIds }, rooms),
    start: start ?? firstFloor({ ...size, tiles, heights }),
    crates,
    goals,
    deliveries: [],
    stats: {
      rooms: rooms.length,
      crates: crates.length,
      goals: goals.length,
      importRooms: 0,
      ledgeRooms: 0,
      maxDepth: rooms.reduce((max, room) => Math.max(max, room.depth), 0),
      totalPullDepth: 0,
      generationMs: 0,
      retries: 0,
    },
    trace: [],
  }
}

interface Layout {
  width: number
  height: number
  roomIds: Int16Array
  heights: Uint8Array
  goals: Goal[]
}

function depthOf(options: AsciiOptions, roomId: number): number {
  if (typeof options.depths === 'function') return options.depths(roomId)
  return options.depths?.[roomId] ?? 0
}

function roomPlans(layout: Layout, options: AsciiOptions): RoomPlan[] {
  const highest = layout.roomIds.reduce((max, id) => Math.max(max, id), -1)
  const plans: RoomPlan[] = []
  for (let id = 0; id <= highest; id++) {
    const cells: Vec[] = []
    const ledges: Vec[] = []
    for (let y = 0; y < layout.height; y++) {
      for (let x = 0; x < layout.width; x++) {
        const at = index(layout, x, y)
        if (layout.roomIds[at] !== id) continue
        cells.push({ x, y })
        if (layout.heights[at] === HEIGHT.Ledge) ledges.push({ x, y })
      }
    }
    const inRoom = (goal: Goal) => layout.roomIds[index(layout, goal.x, goal.y)] === id
    plans.push({
      id,
      ...boundsOf(cells),
      slotX: 0,
      slotY: 0,
      slots: [],
      cells,
      depth: depthOf(options, id),
      recipeId: 'ascii',
      concept: `ascii-${id}`,
      motif: 'ascii',
      trapTarget: 0,
      tier: 0,
      imports: 0,
      exports: 0,
      goals: layout.goals.filter(inRoom),
      ledges,
      pullDepth: 0,
      minPushes: null,
      boxLines: null,
      traps: null,
      highway: [],
      notes: [],
    })
  }
  return plans
}

function boundsOf(cells: Vec[]): { x: number; y: number; w: number; h: number } {
  if (cells.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
  const xs = cells.map((cell) => cell.x)
  const ys = cells.map((cell) => cell.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x + 1, h: Math.max(...ys) - y + 1 }
}

function doorsFrom(layout: { width: number; height: number; tiles: Uint8Array; roomIds: Int16Array }, rooms: RoomPlan[]): Door[] {
  const doors: Door[] = []
  for (let y = 0; y < layout.height; y++) {
    for (let x = 0; x < layout.width; x++) {
      if (layout.tiles[index(layout, x, y)] !== TILE.Door) continue
      const sides = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
      ]
        .filter((cell) => cell.x >= 0 && cell.y >= 0 && cell.x < layout.width && cell.y < layout.height)
        .map((cell) => layout.roomIds[index(layout, cell.x, cell.y)])
        .filter((room) => room! >= 0)
      const unique = [...new Set(sides)].sort((a, b) => a! - b!)
      const placed = { x, y, a: unique[0] ?? -1, b: unique[1] ?? unique[0] ?? -1, opensWhen: null }
      doors.push(bindDoor(placed, rooms))
    }
  }
  return doors
}

function firstFloor(layout: { width: number; height: number; tiles: Uint8Array; heights: Uint8Array }): Vec {
  for (let y = 0; y < layout.height; y++) {
    for (let x = 0; x < layout.width; x++) {
      const at = index(layout, x, y)
      if (layout.tiles[at] !== TILE.Void && layout.heights[at] === HEIGHT.Floor) return { x, y }
    }
  }
  return { x: 0, y: 0 }
}

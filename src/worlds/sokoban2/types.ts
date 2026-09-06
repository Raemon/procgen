export interface Vec {
  x: number
  y: number
}

export type Dir = 'up' | 'down' | 'left' | 'right'

export const DIRS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const DIR_LIST: Dir[] = ['up', 'right', 'down', 'left']

export const TILE = {
  Void: 0,
  Ground: 1,
  Door: 2,
} as const

export const HEIGHT = {
  Floor: 0,
  Ledge: 2,
  Wall: 4,
} as const

export const IMPASSABLE = 1 << 20

export const CLIMB = 1

export type CrateColor = 'red' | 'blue'

export const COLORS: CrateColor[] = ['red', 'blue']

export function colorIndex(color: CrateColor): number {
  return COLORS.indexOf(color)
}

export interface Crate {
  id: number
  x: number
  y: number
  color: CrateColor
}

export interface Goal {
  x: number
  y: number
  color: CrateColor
}

export interface RoomRect {
  id: number
  x: number
  y: number
  w: number
  h: number
  slotX: number
  slotY: number
  slots: Vec[]

  cells: Vec[]

  depth: number
}

export interface Door {
  x: number
  y: number
  a: number
  b: number
  opensWhen: number | null
}

export interface RoomPlan extends RoomRect {
  recipeId: string

  concept: string

  motif: string

  trapTarget: number
  tier: number
  imports: number
  exports: number
  goals: Goal[]

  ledges: Vec[]
  pullDepth: number
  minPushes: number | null
  boxLines: number | null
  traps: number | null

  highway: Vec[]
  notes: string[]
}

export interface WorldStats {
  rooms: number
  crates: number
  goals: number
  importRooms: number
  ledgeRooms: number
  maxDepth: number
  totalPullDepth: number
  generationMs: number
  retries: number
}

export interface WorldDelivery {
  fromRoom: number
  toRoom: number

  path: number[]
  parking: Vec
  goal: Goal
}

export interface World {
  seed: number
  width: number
  height: number
  tiles: Uint8Array

  heights: Uint8Array

  roomIds: Int16Array
  rooms: RoomPlan[]
  doors: Door[]
  start: Vec
  crates: Crate[]
  goals: Goal[]
  deliveries: WorldDelivery[]
  stats: WorldStats
  trace: string[]
}

export interface PlayState {
  player: Vec
  crates: Crate[]
  moves: number
  pushes: number
  openedDoors: number[]
}

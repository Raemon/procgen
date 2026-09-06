import { NO_ITEM_SPAWNS } from '@/features/asset-library/items/pickups/itemSpawnSource'
import { registerExampleWorldSeed } from '@/features/asset-library/worlds/seeds/examplePipelines'
import type { Marker } from '@/features/asset-library/worlds/worldSampler'
import { cellWithin, circuitTouches, type Circuit } from '@/features/game/circuits/circuit'
import { nothingToUse } from '@/features/game/fixtures/useOutcome'
import {
  STEP_ALLOWED,
  registerWorldRules,
  rulesWithDefaults,
  stepRefused,
  type AttachContext,
  type Cell,
  type JumpAttempt,
  type StepAttempt,
  type StepVerdict,
  type WorldRules,
} from '@/features/game/worldRules'
import './node/dungeonNode'
import './node/heightsNode'
import { crateLook, doorLook, goalLook } from './node/art'
import { SOKOBAN2_NODE_TYPE } from './node/dungeonKnobs'
import { sokobanDungeon } from './node/seed'
import { fromDungeon, toDungeon } from './node/worldValue'
import { closedDoorsAt, doorIndexAt, openedDoorsOf } from './play/doors'
import { goalSatisfied, type CrateAt } from './play/goals'
import { moveKind } from './play/physics'
import { roomSolved } from './play/rooms'
import { CLIMB, DIRS, HEIGHT, type Crate, type Dir, type Vec, type World } from './types'
import { crateFinder, inBounds, roomAt, surfaceHeight, terrainHeight } from './world'
import { wireDungeon, type RoomWiring } from './play/wiring'

registerExampleWorldSeed(sokobanDungeon)
registerWorldRules({ nodeType: SOKOBAN2_NODE_TYPE, attach: sokoban2Rules, describe: describeSokobanState })

export interface Sokoban2Snapshot {
  crates: Array<[number, number, number]>
  opened: number[]
}

export interface Sokoban2Rules extends WorldRules {
  readonly world: World | null
  crates(): readonly Crate[]
  openedDoors(): number[]
}

export function sokoban2Rules(context: AttachContext): Sokoban2Rules {
  const world = context.builtValue() as World | null
  if (!world) {
    return {
      ...rulesWithDefaults({ nodeId: context.node.id, nodeType: SOKOBAN2_NODE_TYPE }),
      world: null,
      crates: () => [],
      openedDoors: () => [],
    }
  }
  return new Sokoban2Overlay(context.node.id, world)
}

export function describeSokobanState(state: unknown): string {
  const held = sanitizeSnapshot(state)
  return `${held.crates.length} crates moved, ${held.opened.length} doors opened`
}

class Sokoban2Overlay implements Sokoban2Rules {
  readonly nodeType = SOKOBAN2_NODE_TYPE
  readonly items = NO_ITEM_SPAWNS
  private live: Crate[]
  private crateAt: CrateAt
  private opened: Set<number>
  private changes = 0
  private wiring: RoomWiring[] | null = null

  constructor(
    readonly nodeId: string,
    readonly world: World,
  ) {
    this.live = world.crates.map((crate) => ({ ...crate }))
    this.crateAt = crateFinder(this.live)
    this.opened = openedDoorsOf(world, this.live)
  }

  crates(): readonly Crate[] {
    return this.live
  }

  openedDoors(): number[] {
    return [...this.opened].sort((a, b) => a - b)
  }

  owns(x: number, y: number): boolean {
    const cell = toDungeon(this.world, x, y)
    return inBounds(this.world, cell.x, cell.y)
  }

  initialMine(): unknown {
    return null
  }

  spawn(): Cell {
    return fromDungeon(this.world, this.world.start)
  }

  surfaceRiseAt(x: number, y: number): number {
    const cell = toDungeon(this.world, x, y)
    return this.crateAt(cell.x, cell.y) ? 1 : 0
  }

  blocksAt(x: number, y: number): boolean {
    const cell = toDungeon(this.world, x, y)
    return this.crateAt(cell.x, cell.y) !== undefined || this.doorIsShut(cell)
  }

  step(attempt: StepAttempt): StepVerdict {
    const from = toDungeon(this.world, attempt.from.x, attempt.from.y)
    const to = toDungeon(this.world, attempt.to.x, attempt.to.y)
    if (!inBounds(this.world, to.x, to.y)) return stepRefused(`the dungeon ends at (${attempt.to.x},${attempt.to.y})`)
    const dir = dirOf(attempt.dx, attempt.dy)
    if (!dir) return stepRefused('the dungeon only takes steps along a row or a column')
    const outcome = moveKind(this.world, this.crateAt, from, dir, closedDoorsAt(this.world, this.opened))
    if (outcome.kind === 'walk') return STEP_ALLOWED
    if (outcome.kind === 'climb') return stepRefused(`(${attempt.to.x},${attempt.to.y}) stands a step up; jump to get onto it`)
    if (outcome.kind === 'push') {
      if (!attempt.mayPush) return stepRefused(`a crate stands at (${attempt.to.x},${attempt.to.y})`)
      if (attempt.commit) this.pushCrate(outcome.crate, outcome.destination)
      return STEP_ALLOWED
    }
    return stepRefused(this.whyBlocked(from, to, attempt.to))
  }

  jump(attempt: JumpAttempt): Cell | null {
    const from = toDungeon(this.world, attempt.from.x, attempt.from.y)
    const dir = dirOf(attempt.dx, attempt.dy)
    if (!dir) return null
    const to = { x: from.x + DIRS[dir].x, y: from.y + DIRS[dir].y }
    if (!inBounds(this.world, to.x, to.y) || terrainHeight(this.world, to.x, to.y) >= HEIGHT.Wall) return null
    if (this.doorIsShut(to)) return null
    const feet = surfaceHeight(this.world, this.crateAt, from.x, from.y)
    const surface = surfaceHeight(this.world, this.crateAt, to.x, to.y)
    if (surface > feet + CLIMB) return null
    return fromDungeon(this.world, to)
  }

  markersIn(minX: number, minY: number, maxX: number, maxY: number): Marker[] {
    const markers: Marker[] = []
    const within = (cell: Vec): Vec | null => {
      const at = fromDungeon(this.world, cell)
      return at.x < minX || at.x > maxX || at.y < minY || at.y > maxY ? null : at
    }
    for (const goal of this.world.goals) {
      const at = within(goal)
      if (at) markers.push({ x: at.x, y: at.y, ...goalLook(goal.color, goalSatisfied(goal, this.crateAt)) })
    }
    this.world.doors.forEach((door, id) => {
      const at = within(door)
      if (at) markers.push({ x: at.x, y: at.y, ...doorLook(this.opened.has(id), door.opensWhen) })
    })
    for (const crate of this.live) {
      const at = within(crate)
      if (at) markers.push({ x: at.x, y: at.y, ...crateLook(crate.color, this.crateIsSettled(crate)) })
    }
    return markers
  }

  circuitsIn(minX: number, minY: number, maxX: number, maxY: number): Circuit[] {
    this.wiring ??= wireDungeon(this.world)
    return this.wiring
      .map((room) => this.circuitOf(room))
      .filter((circuit) => circuitTouches(circuit, minX, minY, maxX, maxY))
  }

  cratesIn(minX: number, minY: number, maxX: number, maxY: number): Cell[] {
    return this.live.map((crate) => fromDungeon(this.world, crate)).filter((at) => cellWithin(at, minX, minY, maxX, maxY))
  }

  actionAt(): string | null {
    return null
  }

  use(x: number, y: number) {
    return nothingToUse(x, y)
  }

  resetRoomAt(x: number, y: number): string | null {
    const cell = toDungeon(this.world, x, y)
    const room = roomAt(this.world, cell.x, cell.y)
    if (room < 0) return null
    const original = new Map(this.world.crates.map((crate) => [crate.id, crate]))
    for (const crate of this.live) {
      const home = original.get(crate.id)
      if (!home || roomAt(this.world, home.x, home.y) !== room) continue
      crate.x = home.x
      crate.y = home.y
    }
    this.crateAt = crateFinder(this.live)
    this.changes += 1
    return `room ${room}`
  }

  resetGrowsAFreshWorld(): boolean {
    return true
  }

  revision(): number {
    return this.changes
  }

  snapshot(): Sokoban2Snapshot {
    return {
      crates: this.live
        .filter((crate) => {
          const home = this.world.crates.find((each) => each.id === crate.id)
          return !home || home.x !== crate.x || home.y !== crate.y
        })
        .map((crate) => [crate.id, crate.x, crate.y]),
      opened: this.openedDoors(),
    }
  }

  applySnapshot(raw: unknown): void {
    const held = sanitizeSnapshot(raw)
    this.live = this.world.crates.map((crate) => ({ ...crate }))
    for (const [id, x, y] of held.crates) {
      const crate = this.live.find((each) => each.id === id)
      if (crate && inBounds(this.world, x, y)) {
        crate.x = x
        crate.y = y
      }
    }
    this.crateAt = crateFinder(this.live)
    const latched = held.opened.filter((door) => door >= 0 && door < this.world.doors.length)
    this.opened = openedDoorsOf(this.world, this.live, latched)
    this.changes += 1
  }

  private pushCrate(crate: Crate, destination: Vec): void {
    const moved = this.live.find((each) => each.id === crate.id)
    if (!moved) return
    moved.x = destination.x
    moved.y = destination.y
    this.crateAt = crateFinder(this.live)
    this.opened = openedDoorsOf(this.world, this.live, this.opened)
    this.changes += 1
  }

  private circuitOf(room: RoomWiring): Circuit {
    return {
      key: `${this.nodeId}:room ${room.room}`,
      plates: room.goals.map((goal) => ({ ...fromDungeon(this.world, goal), lit: goalSatisfied(goal, this.crateAt) })),
      doors: room.doors.map((id) => ({ ...fromDungeon(this.world, this.world.doors[id]!), open: this.opened.has(id) })),
      wires: room.wires.map((cell) => fromDungeon(this.world, cell)),
      powered: roomSolved(this.world, this.live, room.room),
    }
  }

  private doorIsShut(cell: Vec): boolean {
    const door = doorIndexAt(this.world, cell.x, cell.y)
    return door >= 0 && !this.opened.has(door)
  }

  private crateIsSettled(crate: Crate): boolean {
    return this.world.goals.some((goal) => goal.x === crate.x && goal.y === crate.y && goal.color === crate.color)
  }

  private whyBlocked(from: Vec, to: Vec, at: Cell): string {
    const here = `(${at.x},${at.y})`
    const door = doorIndexAt(this.world, to.x, to.y)
    if (door >= 0 && !this.opened.has(door)) {
      const waitsOn = this.world.doors[door]!.opensWhen
      return `the door at ${here} is shut until room ${waitsOn ?? '?'} is finished`
    }
    if (terrainHeight(this.world, to.x, to.y) >= HEIGHT.Wall) return `a wall stands at ${here}`
    const crate = this.crateAt(to.x, to.y)
    if (crate) return `the ${crate.color} crate at ${here} cannot be pushed that way`
    const rise = surfaceHeight(this.world, this.crateAt, to.x, to.y) - surfaceHeight(this.world, this.crateAt, from.x, from.y)
    if (rise > CLIMB) return `${here} is a ledge ${rise} up; push a crate against it and jump from the crate`
    return `something at ${here} is in the way`
  }
}

function dirOf(dx: number, dy: number): Dir | null {
  if (dx === 0 && dy === -1) return 'up'
  if (dx === 0 && dy === 1) return 'down'
  if (dx === -1 && dy === 0) return 'left'
  if (dx === 1 && dy === 0) return 'right'
  return null
}

function sanitizeSnapshot(raw: unknown): Sokoban2Snapshot {
  const held = (raw ?? {}) as { crates?: unknown; opened?: unknown }
  const crates = Array.isArray(held.crates)
    ? held.crates.filter(
        (entry): entry is [number, number, number] =>
          Array.isArray(entry) && entry.length === 3 && entry.every((value) => typeof value === 'number' && Number.isFinite(value)),
      )
    : []
  const opened = Array.isArray(held.opened)
    ? held.opened.filter((entry): entry is number => typeof entry === 'number' && Number.isInteger(entry))
    : []
  return { crates, opened }
}

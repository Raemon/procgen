import { NO_ITEM_SPAWNS } from '@/features/asset-library/items/pickups/itemSpawnSource'
import type { Marker } from '@/features/asset-library/worlds/worldSampler'
import type { Circuit } from '@/features/game/circuits/circuit'
import { nothingToUse } from '@/features/game/fixtures/useOutcome'
import { Revision } from '@/features/game/sharedRevision'
import {
  STEP_ALLOWED,
  rulesWithDefaults,
  stepRefused,
  type AttachContext,
  type Cell,
  type JumpAttempt,
  type StepAttempt,
  type StepVerdict,
  type WorldRules,
} from '@/features/game/worldRules'
import { SOKOBAN2_NODE_TYPE } from '../node/dungeonKnobs'
import { fromDungeon, toDungeon } from '../node/worldValue'
import { closedDoorsAt, openedDoorsOf } from '../play/doors'
import { moveKind } from '../play/physics'
import { wireDungeon, type RoomWiring } from '../play/wiring'
import { CLIMB, DIRS, HEIGHT, type Crate, type Vec, type World } from '../types'
import { crateFinder, inBounds, roomAt, surfaceHeight, terrainHeight } from '../world'
import { circuitsOf, cratesOf } from './circuits'
import { doorIsShut, dungeonStateOf, openedDoorsSorted, type DungeonState } from './dungeonState'
import { markersOf } from './markers'
import { dirOf, whyBlocked } from './refusals'
import { applySnapshotTo, snapshotOf, type Sokoban2Snapshot } from './snapshot'

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

class Sokoban2Overlay implements Sokoban2Rules {
  readonly nodeType = SOKOBAN2_NODE_TYPE
  readonly items = NO_ITEM_SPAWNS
  private readonly state: DungeonState
  private readonly changes = new Revision()
  private wiring: RoomWiring[] | null = null

  constructor(
    readonly nodeId: string,
    readonly world: World,
  ) {
    this.state = dungeonStateOf(world)
  }

  crates(): readonly Crate[] {
    return this.state.live
  }

  openedDoors(): number[] {
    return openedDoorsSorted(this.state)
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
    return this.state.crateAt(cell.x, cell.y) ? 1 : 0
  }

  blocksAt(x: number, y: number): boolean {
    const cell = toDungeon(this.world, x, y)
    return this.state.crateAt(cell.x, cell.y) !== undefined || doorIsShut(this.state, cell)
  }

  step(attempt: StepAttempt): StepVerdict {
    const from = toDungeon(this.world, attempt.from.x, attempt.from.y)
    const to = toDungeon(this.world, attempt.to.x, attempt.to.y)
    if (!inBounds(this.world, to.x, to.y)) return stepRefused(`the dungeon ends at (${attempt.to.x},${attempt.to.y})`)
    const dir = dirOf(attempt.dx, attempt.dy)
    if (!dir) return stepRefused('the dungeon only takes steps along a row or a column')
    const outcome = moveKind(this.world, this.state.crateAt, from, dir, closedDoorsAt(this.world, this.state.opened))
    if (outcome.kind === 'walk') return STEP_ALLOWED
    if (outcome.kind === 'climb') return stepRefused(`(${attempt.to.x},${attempt.to.y}) stands a step up; jump to get onto it`)
    if (outcome.kind === 'push') {
      if (!attempt.mayPush) return stepRefused(`a crate stands at (${attempt.to.x},${attempt.to.y})`)
      if (attempt.commit) this.pushCrate(outcome.crate, outcome.destination)
      return STEP_ALLOWED
    }
    return stepRefused(whyBlocked(this.state, from, to, attempt.to))
  }

  jump(attempt: JumpAttempt): Cell | null {
    const from = toDungeon(this.world, attempt.from.x, attempt.from.y)
    const dir = dirOf(attempt.dx, attempt.dy)
    if (!dir) return null
    const to = { x: from.x + DIRS[dir].x, y: from.y + DIRS[dir].y }
    if (!inBounds(this.world, to.x, to.y) || terrainHeight(this.world, to.x, to.y) >= HEIGHT.Wall) return null
    if (doorIsShut(this.state, to)) return null
    const feet = surfaceHeight(this.world, this.state.crateAt, from.x, from.y)
    const surface = surfaceHeight(this.world, this.state.crateAt, to.x, to.y)
    if (surface > feet + CLIMB) return null
    return fromDungeon(this.world, to)
  }

  markersIn(minX: number, minY: number, maxX: number, maxY: number): Marker[] {
    return markersOf(this.state, minX, minY, maxX, maxY)
  }

  circuitsIn(minX: number, minY: number, maxX: number, maxY: number): Circuit[] {
    this.wiring ??= wireDungeon(this.world)
    return circuitsOf(this.nodeId, this.state, this.wiring, minX, minY, maxX, maxY)
  }

  cratesIn(minX: number, minY: number, maxX: number, maxY: number): Cell[] {
    return cratesOf(this.state, minX, minY, maxX, maxY)
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
    let moved = false
    for (const crate of this.state.live) {
      const home = original.get(crate.id)
      if (!home || roomAt(this.world, home.x, home.y) !== room) continue
      if (crate.x === home.x && crate.y === home.y) continue
      crate.x = home.x
      crate.y = home.y
      moved = true
    }
    if (!moved) return `room ${room}`
    this.state.crateAt = crateFinder(this.state.live)
    this.changes.bump()
    return `room ${room}`
  }

  resetGrowsAFreshWorld(): boolean {
    return true
  }

  revision(): number {
    return this.changes.value()
  }

  snapshot(): Sokoban2Snapshot {
    return snapshotOf(this.state)
  }

  applySnapshot(raw: unknown): void {
    applySnapshotTo(this.state, raw)
    this.changes.bump()
  }

  private pushCrate(crate: Crate, destination: Vec): void {
    const moved = this.state.live.find((each) => each.id === crate.id)
    if (!moved) return
    moved.x = destination.x
    moved.y = destination.y
    this.state.crateAt = crateFinder(this.state.live)
    this.state.opened = openedDoorsOf(this.world, this.state.live, this.state.opened)
    this.changes.bump()
  }
}

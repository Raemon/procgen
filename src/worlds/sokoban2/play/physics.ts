import { CLIMB, DIRS, HEIGHT, type Crate, type Dir, type PlayState, type Vec, type World } from '../types'
import { crateFinder, surfaceHeight, terrainHeight } from '../world'
import { NEVER_LOCKED, doorLock, openedDoorsOf, type LockCheck } from './doors'
import type { CrateAt } from './goals'

export type MoveOutcome =
  | { kind: 'blocked' }
  | { kind: 'walk'; to: Vec }
  | { kind: 'climb'; to: Vec }
  | { kind: 'push'; crate: Crate; to: Vec; destination: Vec; fell: boolean }

export function standingHeight(world: World, crateAt: CrateAt, cell: Vec): number {
  return surfaceHeight(world, crateAt, cell.x, cell.y)
}

function standable(world: World, x: number, y: number): boolean {
  return terrainHeight(world, x, y) < HEIGHT.Wall
}

export function moveKind(world: World, crateAt: CrateAt, from: Vec, dir: Dir, locked: LockCheck = NEVER_LOCKED): MoveOutcome {
  const delta = DIRS[dir]
  const to: Vec = { x: from.x + delta.x, y: from.y + delta.y }
  if (!standable(world, to.x, to.y)) return { kind: 'blocked' }
  const feet = standingHeight(world, crateAt, from)
  return pushOrNull(world, crateAt, locked, feet, to, delta) ?? stepOnto(world, crateAt, locked, feet, to)
}

function pushOrNull(world: World, crateAt: CrateAt, locked: LockCheck, feet: number, to: Vec, delta: Vec): MoveOutcome | null {
  const crate = crateAt(to.x, to.y)
  const resting = terrainHeight(world, to.x, to.y)
  if (!crate || resting !== feet) return null
  const destination: Vec = { x: to.x + delta.x, y: to.y + delta.y }
  const landing = terrainHeight(world, destination.x, destination.y)
  if (landing > resting) return null
  if (crateAt(destination.x, destination.y)) return null
  if (locked(destination.x, destination.y) || locked(to.x, to.y)) return null
  return { kind: 'push', crate, to, destination, fell: landing < resting }
}

function stepOnto(world: World, crateAt: CrateAt, locked: LockCheck, feet: number, to: Vec): MoveOutcome {
  const surface = surfaceHeight(world, crateAt, to.x, to.y)
  if (surface > feet + CLIMB) return { kind: 'blocked' }
  if (locked(to.x, to.y)) return { kind: 'blocked' }
  return surface > feet ? { kind: 'climb', to } : { kind: 'walk', to }
}

export function resolveMove(world: World, state: PlayState, dir: Dir): MoveOutcome {
  const locked = doorLock(world, state.crates, state.openedDoors)
  return moveKind(world, crateFinder(state.crates), state.player, dir, locked)
}

export function initialState(world: World): PlayState {
  return {
    player: { ...world.start },
    crates: world.crates.map((crate) => ({ ...crate })),
    moves: 0,
    pushes: 0,
    openedDoors: [...openedDoorsOf(world, world.crates)].sort((a, b) => a - b),
  }
}

export function step(world: World, state: PlayState, dir: Dir): PlayState {
  const outcome = resolveMove(world, state, dir)
  if (outcome.kind === 'blocked') return state
  const player = outcome.to
  if (outcome.kind !== 'push') {
    return { ...state, player, moves: state.moves + 1 }
  }
  const crates = state.crates.map((crate) =>
    crate.id === outcome.crate.id ? { ...crate, x: outcome.destination.x, y: outcome.destination.y } : crate,
  )
  return {
    player,
    crates,
    moves: state.moves + 1,
    pushes: state.pushes + 1,
    openedDoors: [...openedDoorsOf(world, crates, state.openedDoors)].sort((a, b) => a - b),
  }
}

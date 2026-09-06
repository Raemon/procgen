import type { KnobParamSpec, ParamValue } from '@/features/asset-library/worlds/nodeType'
import { DEFAULT_PARAMS, type GenParams } from '../params'

export const SOKOBAN2_NODE_TYPE = 'sokoban2Dungeon'
export const SOKOBAN2_HEIGHTS_NODE_TYPE = 'sokoban2Heights'

const ROOMS_PER_MS = 1 / 130

function number(label: string, help: string, min: number, max: number, step: number, fallback: number): KnobParamSpec {
  return { kind: 'number', label, help, min, max, step, default: fallback }
}

function int(label: string, help: string, min: number, max: number, fallback: number): KnobParamSpec {
  return { kind: 'int', label, help, min, max, default: fallback }
}

export const DUNGEON_PARAMS: Record<string, KnobParamSpec> = {
  cols: int('columns', 'How many room slots wide the maze is.', 2, 8, 5),
  rows: int('rows', 'How many room slots tall the maze is.', 2, 8, 5),
  maxRoomSlots: int('largest room', 'The most slots one room may swallow; 1 keeps every room a single slot.', 1, 4, 2),
  roomW: int('room width', 'Interior width of one slot, in tiles.', 5, 11, 7),
  roomH: int('room height', 'Interior height of one slot, in tiles.', 5, 11, 7),
  loopChance: number('loops', 'Odds that a shared wall the spanning tree left closed gets a door anyway, so the maze has cycles.', 0, 1, 0.05, 0.15),
  obstacleDensity: number('obstacles', 'How much of a room floor is pillars.', 0, 0.5, 0.01, 0.08),
  minCrates: int('fewest crates', 'The fewest crates a puzzle room may hold.', 1, 4, 1),
  maxCrates: int('most crates', 'The most crates a puzzle room may hold.', 1, 6, 4),
  pullEffort: int('pull effort', 'How hard the furnisher works pulling crates backwards from their goals to find a puzzle.', 4, 40, 14),
  difficultyRamp: number('difficulty ramp', 'How steeply rooms get harder with depth.', 0, 3, 0.1, 1),
  crossRoomStart: number('deliveries start', 'Fraction of the maze depth before rooms may import a crate from another room.', 0, 1, 0.05, 0.55),
  crossRoomChance: number('delivery odds', 'Odds a room past that depth asks for a delivered crate.', 0, 1, 0.05, 0.3),
  runSolver: { kind: 'toggle', label: 'run the solver', help: 'Also run the full solver over every room while building; slower, stricter.', default: 0 },
  ledgeChance: number('ledges', 'Odds a puzzle room is built around a ledge a crate can drop from; scaled up with depth.', 0, 1, 0.05, 0.5),
  colorMixStart: number('colors mix', 'Fraction of the maze depth before rooms mix red and blue crates.', 0, 1, 0.05, 0.2),
  lessonJitter: number('lesson jitter', 'How far a room may draw its lesson from ahead of or behind its place in the curriculum.', 0, 1, 0.05, 0.25),
}

export const DUNGEON_TILE_PARAMS: Record<string, KnobParamSpec> = {
  floorTile: { kind: 'tile', label: 'floor', help: 'Tile painted on room floors and through every doorway.' },
  ledgeTile: { kind: 'tile', label: 'ledge', help: 'Tile painted on the two-high shelves crates drop from.' },
  wallTile: { kind: 'tile', label: 'wall', help: 'Tile painted on every wall and pillar; it should block walking.' },
}

export function genParamsOf(params: Record<string, ParamValue>): GenParams {
  const numeric = (name: keyof GenParams): number => {
    const value = params[name]
    return typeof value === 'number' && Number.isFinite(value) ? value : (DEFAULT_PARAMS[name] as number)
  }
  return {
    cols: Math.round(numeric('cols')),
    rows: Math.round(numeric('rows')),
    maxRoomSlots: Math.round(numeric('maxRoomSlots')),
    roomW: Math.round(numeric('roomW')),
    roomH: Math.round(numeric('roomH')),
    loopChance: numeric('loopChance'),
    obstacleDensity: numeric('obstacleDensity'),
    minCrates: Math.round(numeric('minCrates')),
    maxCrates: Math.max(Math.round(numeric('minCrates')), Math.round(numeric('maxCrates'))),
    pullEffort: Math.round(numeric('pullEffort')),
    difficultyRamp: numeric('difficultyRamp'),
    crossRoomStart: numeric('crossRoomStart'),
    crossRoomChance: numeric('crossRoomChance'),
    runSolver: params.runSolver === 1,
    ledgeChance: numeric('ledgeChance'),
    lowWallChance: DEFAULT_PARAMS.lowWallChance,
    colorMixStart: numeric('colorMixStart'),
    lessonJitter: numeric('lessonJitter'),
  }
}

export function estimatedBuildMs(params: Record<string, ParamValue>): number {
  const knobs = genParamsOf(params)
  return (knobs.cols * knobs.rows) / ROOMS_PER_MS
}

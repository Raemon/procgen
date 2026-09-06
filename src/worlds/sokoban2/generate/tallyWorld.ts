import { COLORS, type CrateColor, type RoomPlan, type World, type WorldStats } from '../types'

export function tallyWorld(world: World, maxDepth: number, startedAt: number, retries: number): WorldStats {
  const work = countPuzzleWork(world.rooms)
  return {
    rooms: world.rooms.length,
    crates: world.crates.length,
    goals: work.goalCount,
    importRooms: work.importRooms,
    ledgeRooms: work.ledgeRooms,
    maxDepth,
    totalPullDepth: work.pullDepth,
    generationMs: performance.now() - startedAt,
    retries,
  }
}

interface PuzzleWork {
  goalCount: number
  pullDepth: number
  importRooms: number
  ledgeRooms: number
}

function countPuzzleWork(rooms: RoomPlan[]): PuzzleWork {
  const work: PuzzleWork = { goalCount: 0, pullDepth: 0, importRooms: 0, ledgeRooms: 0 }
  for (const room of rooms) {
    work.goalCount += room.goals.length
    work.pullDepth += room.pullDepth
    if (room.imports > 0) work.importRooms++
    if (room.ledges.length > 0) work.ledgeRooms++
  }
  return work
}

export function colorTally(world: World): string {
  return COLORS.map((color) => `${color} ${countColor(world, color)}`).join(', ')
}

function countColor(world: World, color: CrateColor): string {
  const crates = world.crates.filter((crate) => crate.color === color).length
  const goals = world.goals.filter((goal) => goal.color === color).length
  return `${crates}/${goals}`
}

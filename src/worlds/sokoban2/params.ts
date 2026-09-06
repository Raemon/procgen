export interface GenParams {
  cols: number
  rows: number
  maxRoomSlots: number
  roomW: number
  roomH: number
  loopChance: number
  obstacleDensity: number
  minCrates: number
  maxCrates: number
  pullEffort: number
  difficultyRamp: number
  crossRoomStart: number
  crossRoomChance: number
  runSolver: boolean

  ledgeChance: number

  lowWallChance: number

  colorMixStart: number

  lessonJitter: number
}

export const DEFAULT_PARAMS: GenParams = {
  cols: 3,
  rows: 3,
  maxRoomSlots: 4,
  roomW: 7,
  roomH: 7,
  loopChance: 0.15,
  obstacleDensity: 0.08,
  minCrates: 1,
  maxCrates: 4,
  pullEffort: 14,
  difficultyRamp: 1,
  crossRoomStart: 0.55,
  crossRoomChance: 0.3,
  runSolver: false,
  ledgeChance: 0.5,
  lowWallChance: 0.25,
  colorMixStart: 0.2,
  lessonJitter: 0.25,
}

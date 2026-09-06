import { HEIGHT } from '../../types'
import { flood, inFlood, stampCrateCells, type BoardPhysics } from '../physics'
import { applyPull, pullCandidates, pullPath } from './pullMoves'
import { isLedgeScript, stalled, type Reverse, type ReverseStall, type ReverseState } from './reverseRun'

const PHASE_STEPS = 3
const STAIR_STEPS = 8
const STAIR_TRIES = 4

export function scriptedPhases(rev: Reverse, start: ReverseState): ReverseState[] | null {
  let best: { states: ReverseState[]; score: number } | null = null
  const targets: (number | null)[] = [null, ...rev.rng.shuffle([...rev.steps]).slice(0, STAIR_TRIES)]
  for (const target of targets) {
    const states = phasesFrom(rev, start, target)
    if (!states) continue
    const score = phaseScore(rev, states[states.length - 1]!)
    if (score === 3) return states
    if (!best || score > best.score) best = { states, score }
  }
  return best ? best.states : null
}

function phaseScore(rev: Reverse, state: ReverseState): number {
  const walkable = entryReaches(rev, state) ? 2 : 0
  const stillAClimb = rev.placed && preClimbed(rev.phys, rev.colors, rev.placed.component.cells, state) ? 0 : 1
  return walkable + stillAClimb
}

export function preClimbed(phys: BoardPhysics, colors: Int8Array, ledge: number[], state: ReverseState): boolean {
  if (ledge.length === 0) return false
  if (phys.terrain[state.player] !== HEIGHT.Floor) return true
  stampCrateCells(phys, state.cells, colors)
  const reach = flood(phys, state.player, 0)
  return ledge.some((cell) => inFlood(reach, cell))
}

export function dividedPhases(rev: Reverse, start: ReverseState): ReverseState[] | null {
  if (start.cells.length < 2 || rev.steps.size === 0) return null
  const states: ReverseState[] = []
  const now = () => (states.length > 0 ? states[states.length - 1] : start)
  const toStep = pullPath(rev, now()!, 1, (cell) => rev.steps.has(cell), STAIR_STEPS, 0)
  if (!toStep) return stalledAt(rev, 'divideCross')
  states.push(...toStep)
  const offGoal = pullPath(rev, now()!, 0, (cell) => cell !== rev.goalCells[0], PHASE_STEPS, 1)
  if (!offGoal) return stalledAt(rev, 'divideOffGoal')
  states.push(...offGoal)
  return states
}

function stalledAt(rev: Reverse, stall: ReverseStall): null {
  stalled(rev, stall)
  return null
}

function phasesFrom(rev: Reverse, start: ReverseState, target: number | null): ReverseState[] | null {
  const states: ReverseState[] = []
  const now = () => (states.length > 0 ? states[states.length - 1] : start)

  const toStair = pinStepCrate(rev, now()!, target)
  if (!toStair) return stalledAt(rev, 'stepPin')
  states.push(...toStair)

  const up = rev.script === 'ledgeTop' ? alongTheTop(rev, now()!) : dropInverse(rev, now()!)
  if (!up) return null
  states.push(...up)

  if (isLedgeScript(rev.script)) states.push(...stepAway(rev, now()!))
  return states
}

function dropInverse(rev: Reverse, state: ReverseState): ReverseState[] | null {
  const states: ReverseState[] = []
  const now = () => (states.length > 0 ? states[states.length - 1] : state)
  const toLanding = walkToLanding(rev, now()!)
  if (!toLanding) return stalledAt(rev, 'landing')
  states.push(...toLanding)
  const climb = climbPull(rev, now()!)
  if (!climb) return stalledAt(rev, 'climb')
  states.push(climb)
  states.push(...alongLedge(rev, now()!, rev.rng.int(0, 2)))
  return states
}

function alongTheTop(rev: Reverse, state: ReverseState): ReverseState[] | null {
  const states = alongLedge(rev, state, rev.rng.int(1, PHASE_STEPS))
  return states.length > 0 ? states : stalledAt(rev, 'along')
}

function pinStepCrate(rev: Reverse, state: ReverseState, target: number | null): ReverseState[] | null {
  const wanted = (cell: number) => (target === null ? rev.steps.has(cell) : cell === target)
  return pullPath(rev, state, 1, wanted, STAIR_STEPS, rev.script === 'stepFirst' ? 1 : 0)
}

function walkToLanding(rev: Reverse, state: ReverseState): ReverseState[] | null {
  const onLanding = (cell: number) => rev.climbs.has(cell)
  return pullPath(rev, state, 0, onLanding, PHASE_STEPS, 0) ?? pullPath(rev, state, 0, onLanding, STAIR_STEPS, 0)
}

function stepAway(rev: Reverse, state: ReverseState): ReverseState[] {
  const offStair = (cell: number) => !rev.steps.has(cell)
  const away =
    pullPath(rev, state, 1, offStair, STAIR_STEPS, rev.rng.int(1, PHASE_STEPS)) ??
    pullPath(rev, state, 1, offStair, STAIR_STEPS, 1) ??
    pullPath(rev, state, 1, () => true, PHASE_STEPS, 1)
  return away ?? []
}

function entryReaches(rev: Reverse, state: ReverseState): boolean {
  if (rev.entries.length === 0) return true
  stampCrateCells(rev.phys, state.cells, rev.colors)
  return rev.entries.some((entry) => inFlood(flood(rev.phys, entry, 0), state.player))
}

function climbPull(rev: Reverse, state: ReverseState): ReverseState | null {
  const options = pullCandidates(rev, state).filter(
    (pull) => pull.index === 0 && rev.phys.terrain[pull.to] === HEIGHT.Ledge && rev.phys.terrain[pull.from] === HEIGHT.Floor,
  )
  if (options.length === 0) return null
  return applyPull(state, rev.rng.pick(options))
}

function alongLedge(rev: Reverse, state: ReverseState, steps: number): ReverseState[] {
  const states: ReverseState[] = []
  let now = state
  for (let step = 0; step < steps; step++) {
    const options = pullCandidates(rev, now).filter(
      (pull) => pull.index === 0 && rev.phys.terrain[pull.to] === HEIGHT.Ledge && rev.phys.terrain[pull.from] === HEIGHT.Ledge,
    )
    if (options.length === 0) return states
    now = applyPull(now, rev.rng.pick(options))
    states.push(now)
  }
  return states
}

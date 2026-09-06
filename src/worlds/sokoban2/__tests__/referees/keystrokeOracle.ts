import { DIR_LIST, type PlayState, type World } from '../../types'
import { isSolved } from '../../play/goals'
import { initialState, step } from '../../play/physics'

export interface OracleResult {
  finished: boolean
  pushes: number | null
  states: number
}

function stateKey(state: PlayState): string {
  const crates = state.crates.map((crate) => `${crate.x},${crate.y}`).join(';')
  return `${state.player.x},${state.player.y}|${crates}`
}

export function oracleSolve(world: World, stateCap: number): OracleResult {
  const start = initialState(world)
  if (isSolved(world, start.crates)) return { finished: true, pushes: 0, states: 1 }
  const best = new Map<string, number>([[stateKey(start), 0]])
  let frontier: PlayState[] = [start]

  for (let level = 0; frontier.length > 0; level++) {
    const stack = frontier.slice()
    const next: PlayState[] = []
    let solvedDeeper = false
    while (stack.length > 0) {
      const state = stack.pop() as PlayState
      if ((best.get(stateKey(state)) ?? -1) < level) continue
      for (const dir of DIR_LIST) {
        const moved = step(world, state, dir)
        if (moved === state) continue
        const key = stateKey(moved)
        const cost = moved.pushes > state.pushes ? level + 1 : level
        const prior = best.get(key)
        if (prior !== undefined && prior <= cost) continue
        best.set(key, cost)
        if (best.size > stateCap) return { finished: false, pushes: null, states: best.size }
        const solved = isSolved(world, moved.crates)
        if (solved && cost === level) return { finished: true, pushes: level, states: best.size }
        if (solved) solvedDeeper = true
        if (cost === level) stack.push(moved)
        else next.push(moved)
      }
    }
    if (solvedDeeper) return { finished: true, pushes: level + 1, states: best.size }
    frontier = next
  }
  return { finished: true, pushes: null, states: best.size }
}

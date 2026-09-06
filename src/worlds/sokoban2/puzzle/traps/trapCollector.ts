import { colorName } from '../physics'
import { boardCrates, type PushEvent } from '../solver'
import type { BoardCrate } from '../board'
import type { CrateColor } from '../../types'
import {
  countsAsTrap,
  isWallHug,
  proveLost,
  stillWinnable,
  type CrateState,
  type TrapContext,
  type TrapKind,
  type TrapProof,
} from './lostProofs'

export interface TemptingTrap {
  kind: TrapKind

  proof: TrapProof

  from: number
  to: number
  color: CrateColor

  depth: number
  cratesAfter: BoardCrate[]
  playerAfter: number

  cratesBefore: BoardCrate[]
  playerBefore: number

  wallHug: boolean

  generic: boolean
}

type TrapVerdict = 'counted' | 'lost' | 'alive'

const TRAP_CAP = 12

const GENERIC_TRAPS = new Set<TrapKind>(['overshoot', 'greedy'])

const ORDERING_TRAPS = new Set<TrapKind>(['stepStranding', 'prematureCrossing'])

export class TrapCollector {
  readonly traps: TemptingTrap[] = []
  private readonly claimed = new Set<string>()
  private readonly solution: Set<string>

  constructor(private readonly ctx: TrapContext, path: PushEvent[] | null) {
    this.solution = new Set((path ?? []).map((event) => `${event.from}->${event.to}|${event.color}`))
  }

  get full(): boolean {
    return this.traps.length >= TRAP_CAP
  }

  claim(
    kind: TrapKind,
    from: number,
    to: number,
    depth: number,
    colorAt: number,
    before: CrateState,
    after: CrateState,
  ): TrapVerdict {
    const proof = proveLost(this.ctx, after)
    if (!proof) return 'alive'
    if (!this.worthRecording(kind, proof, from, to, colorAt, before)) return 'lost'
    this.claimed.add(`${from}->${to}`)
    this.traps.push(this.trapOf(kind, proof, from, to, depth, colorAt, before, after))
    return 'counted'
  }

  private worthRecording(
    kind: TrapKind,
    proof: TrapProof,
    from: number,
    to: number,
    colorAt: number,
    before: CrateState,
  ): boolean {
    if (this.full || this.claimed.has(`${from}->${to}`)) return false
    if (!ORDERING_TRAPS.has(kind) && this.solution.has(`${from}->${to}|${colorAt}`)) return false
    if (!countsAsTrap(this.ctx, proof, to, colorAt)) return false
    return stillWinnable(this.ctx, before)
  }

  private trapOf(
    kind: TrapKind,
    proof: TrapProof,
    from: number,
    to: number,
    depth: number,
    colorAt: number,
    before: CrateState,
    after: CrateState,
  ): TemptingTrap {
    return {
      kind,
      proof,
      from,
      to,
      color: colorName(colorAt),
      depth,
      cratesAfter: boardCrates(after.cells, after.colors),
      playerAfter: after.player,
      cratesBefore: boardCrates(before.cells, before.colors),
      playerBefore: before.player,
      wallHug: isWallHug(this.ctx, proof, to, colorAt),
      generic: GENERIC_TRAPS.has(kind),
    }
  }
}

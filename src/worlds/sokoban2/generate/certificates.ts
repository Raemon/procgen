import type { Goal, Vec } from '../types'
import type { BoardCrate } from '../puzzle/board'
import type { TrapKind, TrapProof } from '../puzzle/traps/lostProofs'
import type { Appraisal } from './appraise'

export interface TrapCertificate {
  kind: TrapKind
  proof: TrapProof
  cratesAfter: BoardCrate[]
  playerAfter: number

  cratesBefore: BoardCrate[]
  playerBefore: number

  wallHug: boolean

  credited: boolean
}

export interface RoomCertificate {
  roomId: number
  recipeId: string
  concept: string
  w: number
  h: number

  heights: number[]
  goals: Goal[]
  crates: BoardCrate[]
  player: Vec
  ledgeCells: number[]
  traps: TrapCertificate[]

  trapCredit: number
  dependencies: number
}

let ledger: RoomCertificate[] | null = null

export function recordCertificatesInto(into: RoomCertificate[] | null): void {
  ledger = into
}

export function recordCertificate(roomId: number, recipeId: string, appraisal: Appraisal): void {
  if (!ledger) return
  const { board, draft } = appraisal
  ledger.push({
    roomId,
    recipeId,
    concept: appraisal.concept,
    w: board.w,
    h: board.h,
    heights: [...board.height],
    goals: draft.goals.map((goal) => ({ ...goal })),
    crates: draft.crates.map((crate) => ({ ...crate })),
    player: { ...draft.player },
    ledgeCells: [...draft.ledgeCells],
    traps: appraisal.traps.map((trap) => ({
      kind: trap.kind,
      proof: trap.proof,
      cratesAfter: trap.cratesAfter.map((crate) => ({ ...crate })),
      playerAfter: trap.playerAfter,
      cratesBefore: trap.cratesBefore.map((crate) => ({ ...crate })),
      playerBefore: trap.playerBefore,
      wallHug: trap.wallHug,
      credited: appraisal.credited.includes(trap),
    })),
    trapCredit: appraisal.trapCredit,
    dependencies: appraisal.dependencies,
  })
}

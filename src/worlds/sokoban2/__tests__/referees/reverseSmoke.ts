import { HEIGHT, IMPASSABLE, type CrateColor, type Vec } from '../../types'
import { derive, type Rng } from '../../rng'
import {
  at,
  makeCanvas,
  reserve,
  scatterObstacles,
  toBoard,
  type RoomCanvas,
} from '../../puzzle/canvas'
import { cellOf, vecOf, type Board } from '../../puzzle/board'
import { createPhysics, flood, inFlood, stampCrates } from '../../puzzle/physics'
import { placeLedge, type LedgePlacement } from '../../puzzle/ledges'
import type { LedgeShape } from '../../puzzle/ledgeShapes'
import { buildPuzzle, runReverse, type PullScript } from '../../puzzle/reversePlay'
import { candidateStates } from '../../puzzle/reverse/shippableStates'
import { canonicalKey } from '../../puzzle/uniqueness'
import { solveBoard } from '../../puzzle/solver'
import type { PuzzleDraft } from '../../puzzle/draft'
import { check, reportChecks } from './checkRunner'
import { colorTally, emptyTally, histogram, median, printDraft, share, type Tally } from './reverseReport'

const SOLVE_BUDGET = 60000

interface Spec {
  label: string
  script: PullScript
  shape?: LedgeShape
  w: number
  h: number
  density: number
  crates: number
  colors: CrateColor[]
  pullEffort: number

  doors?: number

  pushFloor: number
}

interface Room {
  canvas: RoomCanvas
  placement: LedgePlacement | null
  entries: number[]
}

function buildRoom(spec: Spec, rng: Rng): Room {
  const canvas = makeCanvas(spec.w, spec.h)
  const entries: Vec[] = [{ x: 0, y: rng.int(1, spec.h - 2) }]
  if ((spec.doors ?? 2) > 1) entries.push({ x: spec.w - 1, y: rng.int(1, spec.h - 2) })
  for (const entry of entries) {
    canvas.entries.push(entry)
    reserve(canvas, entry)
  }
  scatterObstacles(canvas, spec.density, rng)
  const placement = spec.shape ? placeLedge(canvas, spec.shape, rng) : null
  return { canvas, placement, entries: entries.map((entry) => at(canvas, entry.x, entry.y)) }
}

interface Attempt {
  room: Room
  draft: PuzzleDraft | null
  board: Board | null
}

function attempt(spec: Spec, seed: number): Attempt {
  const rng = derive(seed, `${spec.label}-${seed}`)
  const room = buildRoom(spec, rng)
  if (spec.shape && !room.placement) return { room, draft: null, board: null }
  const draft = buildPuzzle(room.canvas, {
    crateCount: spec.crates,
    colors: spec.colors,
    pullEffort: spec.pullEffort,
    rng,
    forbiddenRest: new Set(room.entries),
    ledge: room.placement ?? undefined,
    script: spec.script,
  })
  return { room, draft, board: draft ? toBoard(room.canvas, draft.goals) : null }
}

function holdableSides(board: Board, cell: number): number {
  const { x, y } = vecOf(board, cell)
  const steps: Vec[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
  return steps.filter((step) => {
    const next = { x: x + step.x, y: y + step.y }
    if (next.x < 0 || next.y < 0 || next.x >= board.w || next.y >= board.h) return false
    return board.height[cellOf(board, next)]! <= HEIGHT.Ledge
  }).length
}

function decoyStart(board: Board, draft: PuzzleDraft): boolean {
  const goalAt = new Map(draft.goals.map((goal) => [cellOf(board, goal), goal.color]))
  return draft.crates.some((crate) => {
    const goal = goalAt.get(crate.cell)
    return goal !== undefined && goal !== crate.color
  })
}

function pocketGoal(board: Board, draft: PuzzleDraft): boolean {
  return draft.goals.some((goal) => holdableSides(board, cellOf(board, goal)) === 1)
}

function auditDraft(spec: Spec, seed: number, run: Attempt, tally: Tally, show: boolean): void {
  const { draft, board, room } = run
  if (!draft || !board) return
  tally.drafts++
  tally.pulls += draft.pulls
  const label = `${spec.label} ${seed}`

  check(`${label} crates match goals per color`, colorTally(draft.crates) === colorTally(draft.goals),
    `${colorTally(draft.crates)} vs ${colorTally(draft.goals)}`)

  const phys = createPhysics(board)
  stampCrates(phys, draft.crates)
  const playerCell = cellOf(board, draft.player)
  const goalCells = new Map(draft.goals.map((goal) => [cellOf(board, goal), goal.color]))
  const onGoal = draft.crates.filter((crate) => goalCells.get(crate.cell) === crate.color).length
  check(`${label} is not shipped solved`, onGoal < draft.goals.length, `${onGoal}/${draft.goals.length}`)
  check(`${label} rests no crate on a forbidden cell`, draft.crates.every((crate) => !room.entries.includes(crate.cell)))
  check(
    `${label} player is reachable from a doorway`,
    room.entries.some((entry) => inFlood(flood(phys, entry, 0), playerCell)),
  )

  const ledgeCells = new Set(room.placement?.component ?? [])
  if (spec.script === 'ledgeDrop' || spec.script === 'stepFirst' || spec.script === 'ledgeTop') {
    check(`${label} keeps a crate on the ledge`, draft.crates.some((crate) => ledgeCells.has(crate.cell)))
  }
  if (spec.script === 'ledgeTop') {
    check(`${label} puts a goal on the ledge`, draft.goals.some((goal) => ledgeCells.has(cellOf(board, goal))))
  }
  if (ledgeCells.size > 0) {
    check(`${label} starts on the floor`, board.height[playerCell] === HEIGHT.Floor)
    const reach = flood(phys, playerCell, 0)
    check(`${label} start is not pre-climbed`, ![...ledgeCells].some((cell) => inFlood(reach, cell)))
  }

  if (new Set(draft.goals.map((goal) => goal.color)).size > 1) {
    tally.twoColor++
    if (decoyStart(board, draft)) tally.decoys++
    if (pocketGoal(board, draft)) tally.pockets++
  }

  const report = solveBoard(board, draft.crates, playerCell, SOLVE_BUDGET)
  if (report.verdict === 'outOfBudget') tally.overBudget++
  if (report.verdict === 'provablyUnsolvable') printDraft(`${label} UNSOLVABLE`, board, draft)
  check(`${label} is not provably unsolvable`, report.verdict !== 'provablyUnsolvable')
  if (report.verdict === 'solved') {
    tally.solved++
    tally.pushes += report.pushes ?? 0
    tally.pushList.push(report.pushes ?? 0)
    if (spec.script === 'stepFirst') {
      check(`${label} solution drops a crate`, (report.pushPath ?? []).some((push) => push.fell))
    }
  }
  if (show) printDraft(`${spec.label} sample`, board, draft)
}

function runSpec(spec: Spec, seeds: number[]): Tally {
  const tally = emptyTally()
  let shown = false
  for (const seed of seeds) {
    tally.attempts++
    const run = attempt(spec, seed)
    const show = !shown && run.draft !== null
    auditDraft(spec, seed, run, tally, show)
    if (show) shown = true
    if (run.draft) {
      const again = attempt(spec, seed)
      check(`${spec.label} ${seed} is deterministic`, JSON.stringify(again.draft) === JSON.stringify(run.draft))
    }
  }
  const mean = (total: number, count: number) => (count > 0 ? (total / count).toFixed(1) : '-')
  console.log(
    `${spec.label}: ${tally.drafts}/${tally.attempts} drafts, ${tally.solved} solved, ` +
      `${tally.overBudget} over budget, mean pulls ${mean(tally.pulls, tally.drafts)}, ` +
      `mean pushes ${mean(tally.pushes, tally.solved)}`,
  )
  console.log(
    `  minPushes ${histogram(tally.pushList)} | median ${median(tally.pushList)} | ` +
      `>= ${spec.pushFloor} in ${share(tally.pushList.filter((pushes) => pushes >= spec.pushFloor).length, tally.pushList.length)}` +
      (tally.twoColor > 0 ? ` | decoy ${share(tally.decoys, tally.twoColor)} | pocket ${share(tally.pockets, tally.twoColor)}` : ''),
  )
  return tally
}

const SPECS: Spec[] = [
  { label: 'classic 7x7 open', script: 'classic', w: 7, h: 7, density: 0, crates: 2, colors: ['red', 'blue'], pullEffort: 8, pushFloor: 4 },
  { label: 'classic 7x7 rough', script: 'classic', w: 7, h: 7, density: 0.14, crates: 2, colors: ['red', 'blue'], pullEffort: 8, pushFloor: 4 },
  { label: 'classic 9x7 three', script: 'classic', w: 9, h: 7, density: 0.08, crates: 3, colors: ['red', 'red', 'blue'], pullEffort: 6, pushFloor: 4 },
  { label: 'ledgeDrop shelf 7x7', script: 'ledgeDrop', shape: 'shelf', w: 7, h: 7, density: 0.06, crates: 2, colors: ['red', 'blue'], pullEffort: 6, pushFloor: 5 },
  { label: 'ledgeDrop pier 9x7', script: 'ledgeDrop', shape: 'pier', w: 9, h: 7, density: 0.06, crates: 2, colors: ['red', 'blue'], pullEffort: 6, pushFloor: 5 },
  { label: 'stepFirst shelf 7x7', script: 'stepFirst', shape: 'shelf', w: 7, h: 7, density: 0.06, crates: 2, colors: ['red', 'blue'], pullEffort: 6, pushFloor: 7 },
  { label: 'stepFirst pier 9x7', script: 'stepFirst', shape: 'pier', w: 9, h: 7, density: 0.06, crates: 2, colors: ['red', 'blue'], pullEffort: 6, pushFloor: 7 },
  { label: 'mixed shelf 9x7', script: 'stepFirst', shape: 'shelf', w: 9, h: 7, density: 0.08, crates: 3, colors: ['red', 'blue', 'red'], pullEffort: 6, pushFloor: 7 },
  { label: 'ledgeTop pier 9x7', script: 'ledgeTop', shape: 'pier', w: 9, h: 7, density: 0.06, crates: 2, colors: ['red', 'blue'], pullEffort: 6, pushFloor: 5 },
  { label: 'ledgeTop shelf 7x7', script: 'ledgeTop', shape: 'shelf', w: 7, h: 7, density: 0.06, crates: 2, colors: ['red', 'blue'], pullEffort: 6, pushFloor: 5 },
  { label: 'divided 9x7', script: 'divided', shape: 'divider', w: 9, h: 7, density: 0.1, crates: 2, colors: ['red', 'blue'], pullEffort: 8, doors: 1, pushFloor: 5 },
]

const PER_SPEC = 19

function seedsFor(index: number): number[] {
  return Array.from({ length: PER_SPEC }, (_, step) => 20260902 + index * 1000 + step)
}

function ledgeGeometry(): void {
  const rng = derive(4242, 'ledge-geometry')
  let placed = 0
  for (const shape of ['shelf', 'pier', 'divider'] as LedgeShape[]) {
    for (let trial = 0; trial < 30; trial++) {
      const room = buildRoom(
        { label: shape, script: 'classic', shape, w: 9, h: 7, density: 0.08, crates: 2, colors: ['red'], pullEffort: 4, doors: shape === 'divider' ? 1 : 2, pushFloor: 3 },
        rng,
      )
      const placement = room.placement
      if (!placement) continue
      placed++
      const canvas = room.canvas
      const ids = placement.cells.map((cell) => at(canvas, cell.x, cell.y))
      check(`${shape} never lands on a reserved cell`, ids.every((id) => !canvas.reserved[id]))
      check(`${shape} keeps clear of doorways`, ids.every((id) => !touchesEntry(canvas, id)))
      check(`${shape} fits the area budget`, placement.cells.length <= 10, `${placement.cells.length}`)
      if (shape !== 'divider') {
        check(`${shape} offers a landing`, placement.intendedLanding !== undefined)
        check(`${shape} offers a stair`, placement.stairs.length > 0)
      }
    }
  }
  check('ledge geometry had placements to check', placed > 0, `${placed}`)
}

function touchesEntry(canvas: RoomCanvas, id: number): boolean {
  const cell = { x: id % canvas.w, y: Math.floor(id / canvas.w) }
  return canvas.entries.some((entry) => Math.abs(entry.x - cell.x) + Math.abs(entry.y - cell.y) <= 1)
}

function fingerprints(): void {
  const dims = { w: 7, h: 7 }
  const groups = {
    ledges: [{ x: 1, y: 1 }, { x: 2, y: 1 }],
    redGoals: [{ x: 3, y: 4 }],
    blueGoals: [{ x: 5, y: 2 }],
    redCrates: [{ x: 1, y: 5 }],
    blueCrates: [{ x: 4, y: 4 }],
    trapMouths: [{ x: 2, y: 2 }, { x: 2, y: 3 }],
  }
  const key = canonicalKey(dims, 'R2/wrongEdgeDrop', groups)
  const flip = (point: Vec) => ({ x: dims.w - 1 - point.x, y: point.y })
  const mirrored = {
    ledges: groups.ledges.map(flip),
    redGoals: groups.redGoals.map(flip),
    blueGoals: groups.blueGoals.map(flip),
    redCrates: groups.redCrates.map(flip),
    blueCrates: groups.blueCrates.map(flip),
    trapMouths: groups.trapMouths.map(flip),
  }
  check('mirroring does not change the key', canonicalKey(dims, 'R2/wrongEdgeDrop', mirrored) === key)
  const swapped = {
    ...groups,
    redGoals: groups.blueGoals,
    blueGoals: groups.redGoals,
    redCrates: groups.blueCrates,
    blueCrates: groups.redCrates,
  }
  check('swapping the colors does not change the key', canonicalKey(dims, 'R2/wrongEdgeDrop', swapped) === key)
  const moved = { ...groups, redGoals: [{ x: 3, y: 3 }] }
  check('moving a goal does change the key', canonicalKey(dims, 'R2/wrongEdgeDrop', moved) !== key)
  check('the schema is part of the key', canonicalKey(dims, 'R3/stepStranding', groups) !== key)
}

function ledgeFingerprints(): void {
  const dims = { w: 7, h: 7 }
  const groups = {
    ledges: [{ x: 1, y: 1 }, { x: 2, y: 1 }],
    redGoals: [{ x: 3, y: 4 }],
    blueGoals: [{ x: 5, y: 2 }],
    redCrates: [{ x: 1, y: 5 }],
    blueCrates: [{ x: 4, y: 4 }],
    trapMouths: [],
  }
  const shelf = (walled: boolean, mirror: boolean): Int32Array => {
    const height = new Int32Array(dims.w * dims.h)
    const put = (x: number, y: number, value: number) => {
      height[y * dims.w + (mirror ? dims.w - 1 - x : x)] = value
    }
    put(1, 1, HEIGHT.Ledge)
    put(2, 1, HEIGHT.Ledge)
    if (walled) put(3, 1, IMPASSABLE)
    return height
  }
  const key = (walled: boolean) => canonicalKey({ ...dims, height: shelf(walled, false) }, 'R2/wrongEdgeDrop', groups)
  check('the drop geometry is part of the key', key(false) !== key(true))

  const slid = new Int32Array(dims.w * dims.h)
  slid[1 * dims.w + 2] = HEIGHT.Ledge
  slid[1 * dims.w + 3] = HEIGHT.Ledge
  const shifted = { ...groups, ledges: [{ x: 2, y: 1 }, { x: 3, y: 1 }] }
  check(
    'sliding the shelf under fixed goals changes the key',
    canonicalKey({ ...dims, height: slid }, 'R2/wrongEdgeDrop', shifted) !== key(false),
  )

  const flip = (point: Vec) => ({ x: dims.w - 1 - point.x, y: point.y })
  const mirrored = {
    ledges: groups.ledges.map(flip),
    redGoals: groups.redGoals.map(flip),
    blueGoals: groups.blueGoals.map(flip),
    redCrates: groups.redCrates.map(flip),
    blueCrates: groups.blueCrates.map(flip),
    trapMouths: [],
  }
  check(
    'mirroring the terrain with the room does not change the key',
    canonicalKey({ ...dims, height: shelf(false, true) }, 'R2/wrongEdgeDrop', mirrored) === key(false),
  )
}

function candidateOrder(): void {
  const rng = derive(77, 'candidates')
  const room = buildRoom(SPECS[0]!, rng)
  const run = runReverse(room.canvas, {
    crateCount: 2,
    colors: ['red', 'blue'],
    pullEffort: 10,
    rng,
    forbiddenRest: new Set(room.entries),
    script: 'classic',
  })
  check('a classic run produces a history', run !== null)
  if (!run) return
  const states = candidateStates(run)
  check('candidates are ranked deepest first among ties', states.length > 1, `${states.length}`)
  const best = buildPuzzle(room.canvas, {
    crateCount: 2,
    colors: ['red', 'blue'],
    pullEffort: 10,
    rng: derive(77, 'candidates-again'),
    forbiddenRest: new Set(room.entries),
    script: 'classic',
  })
  check('buildPuzzle ships a candidate', best !== null)
}

ledgeGeometry()
fingerprints()
ledgeFingerprints()
candidateOrder()
const totals = emptyTally()
SPECS.forEach((spec, index) => {
  const tally = runSpec(spec, seedsFor(index))
  totals.attempts += tally.attempts
  totals.drafts += tally.drafts
  totals.solved += tally.solved
  totals.overBudget += tally.overBudget
  totals.decoys += tally.decoys
  totals.pockets += tally.pockets
  totals.twoColor += tally.twoColor
})
console.log(
  `total: ${totals.drafts}/${totals.attempts} drafts, ${totals.solved} solved, ${totals.overBudget} over budget, ` +
    `decoy start ${share(totals.decoys, totals.twoColor)}, pocket goal ${share(totals.pockets, totals.twoColor)}`,
)
check('the decoy lever fires sometimes', totals.decoys > 0, `${totals.decoys}/${totals.twoColor}`)
check('the pocket lever fires sometimes', totals.pockets > 0, `${totals.pockets}/${totals.twoColor}`)
reportChecks()

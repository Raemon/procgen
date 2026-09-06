import type { Board, BoardCrate } from '../../puzzle/board'
import type { PuzzleDraft } from '../../puzzle/draft'
import { solveBoard, type SolveReport } from '../../puzzle/solver'
import { difficultyScore, solutionMetrics } from '../../puzzle/solutionMetrics'
import { temptingTraps } from '../../puzzle/traps/temptingTraps'
import type { TemptingTrap } from '../../puzzle/traps/trapCollector'
import { necessity, replayPushes } from '../../puzzle/necessity'
import { boardFromAscii } from './asciiBoard'
import { derive } from '../../rng'
import { check, reportChecks } from './checkRunner'
import { randomRoom } from './randomTrapRooms'

const REFEREE_BUDGET = 60000

interface Room {
  label: string
  board: Board
  draft: PuzzleDraft
  report: SolveReport
  traps: TemptingTrap[]
  at: (x: number, y: number) => number
}

function room(label: string, rows: string[], overlay: string[]): Room {
  const { board, crates, player } = boardFromAscii(rows, overlay)
  const draft: PuzzleDraft = { crates, goals: board.goals, player, pulls: 0, ledgeCells: [] }
  const report = solveBoard(board, crates, player, 200000)
  const traps = temptingTraps(board, draft, report.pushPath)
  return { label, board, draft, report, traps, at: (x, y) => y * board.w + x }
}

function describe(room: Room): void {
  const shape = room.traps.map((trap) => `${trap.kind}/${trap.proof}`).join(' ')
  console.log(`${room.label}: ${room.report.verdict} in ${room.report.pushes} pushes, traps [${shape}]`)
}

function refereeAgrees(room: Room): void {
  for (const trap of room.traps) {
    const after = solveBoard(room.board, trap.cratesAfter, trap.playerAfter, REFEREE_BUDGET).verdict
    check(`${room.label} referee re-proves ${trap.kind}`, after === 'provablyUnsolvable', after)
    const before = solveBoard(room.board, trap.cratesBefore, trap.playerBefore, REFEREE_BUDGET).verdict
    check(`${room.label} ${trap.kind} is tempted from a winnable room`, before === 'solved', before)
  }
}

function hasTrap(room: Room, kind: string, to: number): boolean {
  return room.traps.some((trap) => trap.kind === kind && trap.to === to)
}

const VISIBILITY_ROWS = ['########', '#......#', '#.###..#', '#.#.r..#', '#......#', '#......#', '########']
const VISIBILITY_OVERLAY = ['........', '........', '........', '.R......', '......@.', '........', '........']

function visibilityRule(): void {
  const here = room('visibility', VISIBILITY_ROWS, VISIBILITY_OVERLAY)
  describe(here)
  const corner = here.at(3, 3)
  const band = here.at(5, 5)
  check('visibility room solves', here.report.verdict === 'solved', here.report.verdict)
  check('the band overshoot counts', hasTrap(here, 'overshoot', band), `${here.traps.map((t) => t.to)}`)
  check('the corner is not a trap', !here.traps.some((trap) => trap.to === corner))
  const cornered: BoardCrate[] = [{ cell: corner, color: 'red' }]
  const verdict = solveBoard(here.board, cornered, here.at(4, 3), REFEREE_BUDGET).verdict
  check('the corner really is lost, it is only invisible-to-nobody', verdict === 'provablyUnsolvable', verdict)
  refereeAgrees(here)
}

const MISMATCH_ROWS = ['########', '#......#', '#...r.B#', '#.....##', '#.@.b..#', '#......#', '########']
const MISMATCH_OVERLAY = ['........', '........', '........', '........', '........', '.R......', '........']

function colorMismatch(): void {
  const here = room('mismatch', MISMATCH_ROWS, MISMATCH_OVERLAY)
  describe(here)
  const pocket = here.at(6, 2)
  check('mismatch room solves', here.report.verdict === 'solved', here.report.verdict)
  check('parking red on the blue goal is certified', hasTrap(here, 'colorMismatch', pocket))
  const claimed = here.traps.find((trap) => trap.to === pocket)
  check('the pocket trap is a red crate', claimed?.color === 'red', `${claimed?.color}`)
  check('the pocket trap is a dead square', claimed?.proof === 'deadSquare', `${claimed?.proof}`)
  const report = necessity(here.board, here.draft, here.report)
  check('colors bite here', report.colorsBite, JSON.stringify(report.notes))
  refereeAgrees(here)
}

const DROP_ROWS = ['########', '#......#', '#.==b..#', '#.=%..@#', '#......#', '########']
const DROP_OVERLAY = ['........', '........', '....B...', '....R...', '........', '........']

function wrongEdgeDrop(): void {
  const here = room('wrongEdgeDrop', DROP_ROWS, DROP_OVERLAY)
  describe(here)
  check('the shelf room solves in one drop', here.report.pushes === 1, `${here.report.pushes}`)
  check('the fatal edge is certified', hasTrap(here, 'wrongEdgeDrop', here.at(3, 4)))
  check('the good edge is not a trap', !here.traps.some((trap) => trap.to === here.at(4, 3)))
  const report = necessity(here.board, here.draft, here.report)
  check('the ledge crate is necessary', report.ledgeNecessary)
  check('the wrong edge is recorded', report.wrongEdgeDrop)
  refereeAgrees(here)
}

const STEP_ROWS = ['########', '#.===..#', '#.=%=b.#', '#..@...#', '#......#', '#......#', '########']
const STEP_OVERLAY = ['........', '........', '........', '...R....', '........', '....B...', '........']

function stepStranding(): void {
  const here = room('stepStranding', STEP_ROWS, STEP_OVERLAY)
  describe(here)
  check('the shipped room solves', here.report.verdict === 'solved' && here.report.pushes === 5, `${here.report.pushes}`)
  const trap = here.traps.find((candidate) => candidate.kind === 'stepStranding')
  check('the ordering trap is certified', trap !== undefined)
  check('it is proved by the stranded-ledge lemma', trap?.proof === 'strandedLedge', `${trap?.proof}`)
  check('it is the step crate that is sent home', trap?.color === 'blue', `${trap?.color}`)
  const report = necessity(here.board, here.draft, here.report)
  check('step ordering is claimed', report.stepOrdering)
  check('the ledge crate is necessary', report.ledgeNecessary)
  check('the height ablation gave a verdict', report.heightGain !== null, JSON.stringify(report.notes))
  refereeAgrees(here)
  metrics(here)
  flatSolutionsDoNotReplay(here)
}

function metrics(here: Room): void {
  if (!here.report.pushPath) return
  const measured = solutionMetrics(here.board, here.draft, here.report.pushPath, here.traps)
  console.log(`  metrics ${JSON.stringify(measured)} D=${difficultyScore(measured, here.traps).toFixed(2)}`)
  check('four box lines', measured.boxLines === 4, `${measured.boxLines}`)
  check('one crate switch', measured.crateSwitches === 1, `${measured.crateSwitches}`)
  check('that switch changes color', measured.colorSwitches === 1, `${measured.colorSwitches}`)
  check('one drop', measured.drops === 1, `${measured.drops}`)
  check('one climb', measured.climbs === 1, `${measured.climbs}`)
  check('the ledge crate depends on the step', measured.dependencies >= 1, `${measured.dependencies}`)
  check('the line passes traps', measured.nearMisses >= 1, `${measured.nearMisses}`)
  check('difficulty is positive', difficultyScore(measured, here.traps) > 0)
}

function flatSolutionsDoNotReplay(here: Room): void {
  const onto = [{ from: here.at(5, 2), to: here.at(4, 2), standing: here.at(6, 2), color: 1, fell: false }]
  check('a push onto the shelf face is refused', !replayPushes(here.board, here.draft, onto))
  check('the same push is legal once flattened', replayPushes(flatten(here.board), here.draft, onto))
}

function flatten(board: Board): Board {
  const height = Int32Array.from(board.height, (value) => (value === 2 ? 0 : value))
  return { ...board, height }
}

const KEEP_ROWS = ['#########', '#.......#', '#.=%=...#', '#.===...#', '#.......#', '#@......#', '#########']
const KEEP_OVERLAY = ['.........', '.........', '..R......', '.........', '.B...b...', '.........', '.........']

function ledgeTop(): void {
  const here = room('ledgeTop', KEEP_ROWS, KEEP_OVERLAY)
  describe(here)
  check('the ledge-top room solves', here.report.verdict === 'solved' && (here.report.pushes ?? 0) >= 5, `${here.report.pushes}`)
  check('the solution never drops a crate', (here.report.pushPath ?? []).every((push) => !push.fell))
  check('shoving it off the front is certified', hasTrap(here, 'wrongEdgeDrop', here.at(3, 1)))
  check('shoving it away from the goal along the top is certified', hasTrap(here, 'wrongEdgeDrop', here.at(4, 2)))
  check('sending the stair home first is certified', here.traps.some((trap) => trap.kind === 'stepStranding'))
  const report = necessity(here.board, here.draft, here.report)
  check('the ledge crate is necessary', report.ledgeNecessary)
  check('the wrong edge is recorded', report.wrongEdgeDrop)
  check('step ordering is claimed', report.stepOrdering)
  refereeAgrees(here)
}

const DIVIDED_ROWS = ['#######', '#@....#', '#.rr..#', '#.....#', '#=====#', '#.....#', '#.b...#', '#######']
const DIVIDED_OVERLAY = ['.......', '.......', '....R..', '...R...', '.......', '.......', '...B...', '.......']

function prematureCrossing(): void {
  const here = room('divided', DIVIDED_ROWS, DIVIDED_OVERLAY)
  describe(here)
  check('the divided room solves', here.report.verdict === 'solved', here.report.verdict)
  const trap = here.traps.find((candidate) => candidate.kind === 'prematureCrossing')
  check('crossing early is certified', trap !== undefined)
  check('the crossing lands in the far half', (trap?.to ?? -1) >= here.at(1, 5), `${trap?.to}`)
  check('it is the earliest crossing on the line', trap?.depth === 1, `${trap?.depth}`)
  const report = necessity(here.board, here.draft, here.report)
  check('the room counts as divided', report.divided)
  check('no ledge crate, so no ledge claim', !report.ledgeNecessary)
  refereeAgrees(here)
}

const MONO_ROWS = ['#######', '#.....#', '#..r..#', '#.@...#', '#######']
const MONO_OVERLAY = ['.......', '.......', '.....R.', '.......', '.......']

function monochrome(): void {
  const here = room('monochrome', MONO_ROWS, MONO_OVERLAY)
  describe(here)
  const report = necessity(here.board, here.draft, here.report)
  check('monochrome rooms solve', here.report.verdict === 'solved', here.report.verdict)
  check('colors do not bite', !report.colorsBite, JSON.stringify(report))
  check('the color ablation gains nothing', report.colorGain === 0, `${report.colorGain}`)
  check('no ledge, no ledge claim', !report.ledgeNecessary)
  check('no divider', !report.divided)
  refereeAgrees(here)
}

function randomRooms(count: number): void {
  const rng = derive(20260902, 'quality-smoke-random')
  let rooms = 0
  let traps = 0
  for (let id = 0; id < count; id++) {
    const drawn = randomRoom(rng)
    const here = room(`random ${id}`, drawn.rows, drawn.overlay)
    if (here.report.verdict !== 'solved') continue
    rooms++
    traps += here.traps.length
    for (const trap of here.traps) {
      const after = solveBoard(here.board, trap.cratesAfter, trap.playerAfter, REFEREE_BUDGET).verdict
      const before = solveBoard(here.board, trap.cratesBefore, trap.playerBefore, REFEREE_BUDGET).verdict
      if (after !== 'provablyUnsolvable' || before !== 'solved') {
        console.log(`  ${drawn.rows.join(' / ')}  ${drawn.overlay.join(' / ')}`)
      }
      check(`random ${id} referee re-proves ${trap.kind}/${trap.proof}`, after === 'provablyUnsolvable', after)
      check(`random ${id} ${trap.kind} is tempted from a winnable room`, before === 'solved', before)
    }
    if (id % 25 === 0) ablationsAgree(here)
  }
  console.log(`random rooms: ${rooms}/${count} solvable, ${traps} certified traps all re-proved`)
}

function ablationsAgree(here: Room): void {
  if (!here.report.pushPath) return
  const measured = solutionMetrics(here.board, here.draft, here.report.pushPath)
  const fell = here.report.pushPath.filter((event) => event.fell).length
  check(`${here.label} counts its drops`, measured.drops === fell, `${measured.drops} vs ${fell}`)
  const report = necessity(here.board, here.draft, here.report)
  check(`${here.label} color blind is never longer`, report.colorGain >= 0, `${report.colorGain}`)
  check(`${here.label} flat is never longer`, (report.heightGain ?? 0) >= 0, `${report.heightGain}`)
}

visibilityRule()
colorMismatch()
wrongEdgeDrop()
stepStranding()
ledgeTop()
prematureCrossing()
monochrome()
randomRooms(1500)

reportChecks()

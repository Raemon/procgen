import { HEIGHT, IMPASSABLE, TILE, type World } from '../../types'
import { index } from '../../world'
import { reachableCells } from '../../play/reach'
import { makeBoard, type Board, type BoardCrate } from '../../puzzle/board'
import { backFlood, createPhysics, flood, inFlood, stampCrates } from '../../puzzle/physics'
import {
  UNREACHED,
  aliveByColor,
  colorDistance,
  frozen,
  ledgeAnalyses,
  lost,
  potentialStairs,
  unreachableLedge,
} from '../../puzzle/deadSquares'
import { solveBoard, solveBoardColorBlind, type SolveReport } from '../../puzzle/solver'
import { worldFromAscii } from './ascii'
import { derive } from '../../rng'
import { check, reportChecks } from './checkRunner'
import { oracleSolve, type OracleResult } from './keystrokeOracle'
import { randomRoom, type RoomShape } from './randomPuzzleRooms'

function boardFromWorld(world: World): Board {
  const height = new Int32Array(world.width * world.height)
  for (let cell = 0; cell < height.length; cell++) {
    const terrain = world.heights[cell]
    height[cell] = world.tiles[cell] !== TILE.Void && terrain! <= HEIGHT.Ledge ? terrain! : IMPASSABLE
  }
  return makeBoard(world.width, world.height, height, world.goals)
}

function cratesFromWorld(world: World): BoardCrate[] {
  return world.crates.map((crate) => ({ cell: index(world, crate.x, crate.y), color: crate.color }))
}

function printRoom(label: string, rows: string[], overlay: string[]): void {
  console.log(`  ${label}`)
  for (let y = 0; y < rows.length; y++) console.log(`    ${rows[y]}   ${overlay[y] ?? ''}`)
}

function floodMatchesPlay(world: World, board: Board): string | null {
  const phys = createPhysics(board)
  stampCrates(phys, cratesFromWorld(world))
  const start = index(world, world.start.x, world.start.y)
  const mine = flood(phys, start)
  const theirs = reachableCells(world, world.crates, world.start)
  if (mine.count !== theirs.size) return `sizes ${mine.count} vs ${theirs.size}`
  for (const cell of theirs) if (!inFlood(mine, cell)) return `play reaches ${cell}, flood does not`
  return null
}

function backFloodMatchesFlood(world: World, board: Board, target: number): string | null {
  const phys = createPhysics(board)
  stampCrates(phys, cratesFromWorld(world))
  const backward = backFlood(phys, target, 1)
  const reaches = new Set<number>()
  for (let cell = 0; cell < board.w * board.h; cell++) {
    if (board.height[cell]! > HEIGHT.Ledge) continue
    if (inFlood(flood(phys, cell, 0), target)) reaches.add(cell)
  }
  for (const cell of reaches) if (!inFlood(backward, cell)) return `${cell} reaches ${target}, backFlood misses it`
  for (let cell = 0; cell < board.w * board.h; cell++) {
    if (inFlood(backward, cell) && !reaches.has(cell)) return `backFlood claims ${cell} reaches ${target}`
  }
  return null
}

function verdictAgrees(report: SolveReport, oracle: OracleResult): string | null {
  if (report.verdict === 'outOfBudget') return 'solver ran out of budget on a tiny room'
  if (oracle.pushes === null) {
    return report.verdict === 'provablyUnsolvable' ? null : `solver ${report.verdict}, oracle unsolvable`
  }
  if (report.verdict !== 'solved') return `solver ${report.verdict}, oracle solves in ${oracle.pushes}`
  return report.pushes === oracle.pushes ? null : `solver ${report.pushes} pushes, oracle ${oracle.pushes}`
}

function randomRooms(label: string, count: number, shape: RoomShape): void {
  const rng = derive(20260902, `puzzle-smoke-${label}`)
  let solvedRooms = 0
  let unsolvable = 0
  let oracleGaveUp = 0
  let maxPushes = 0
  let nodes = 0
  let worst = 0
  const started = Date.now()
  for (let id = 0; id < count; id++) {
    const room = randomRoom(rng, shape)
    const world = worldFromAscii(room.rows, { overlay: room.overlay })
    const board = boardFromWorld(world)
    const crates = cratesFromWorld(world)
    const start = index(world, world.start.x, world.start.y)

    const floodError = floodMatchesPlay(world, board)
    if (floodError) printRoom(`${label} ${id} flood mismatch: ${floodError}`, room.rows, room.overlay)
    check(`${label} ${id} flood matches play reachableCells`, floodError === null, floodError ?? '')

    const backError = backFloodMatchesFlood(world, board, start)
    if (backError) printRoom(`${label} ${id} backFlood mismatch: ${backError}`, room.rows, room.overlay)
    check(`${label} ${id} backFlood inverts flood`, backError === null, backError ?? '')

    const report = solveBoard(board, crates, start, 200000)
    nodes += report.nodesUsed
    worst = Math.max(worst, report.nodesUsed)
    const oracle = oracleSolve(world, 400000)
    if (!oracle.finished) {
      oracleGaveUp++
      continue
    }
    const mismatch = verdictAgrees(report, oracle)
    if (mismatch) printRoom(`${label} ${id} verdict mismatch: ${mismatch}`, room.rows, room.overlay)
    check(`${label} ${id} verdict matches oracle`, mismatch === null, mismatch ?? '')
    if (report.verdict === 'solved') {
      solvedRooms++
      maxPushes = Math.max(maxPushes, report.pushes ?? 0)
    }
    if (report.verdict === 'provablyUnsolvable') unsolvable++
  }
  console.log(
    `${label}: ${count} rooms (${solvedRooms} solved, ${unsolvable} provably unsolvable, ` +
      `${oracleGaveUp} oracle over cap, deepest ${maxPushes} pushes), ` +
      `solver nodes ${nodes} total / ${worst} worst, ${Date.now() - started}ms including the oracle`,
  )
}

function solveAscii(rows: string[], overlay: string[], budget = 200000) {
  const world = worldFromAscii(rows, { overlay })
  const board = boardFromWorld(world)
  const crates = cratesFromWorld(world)
  const start = index(world, world.start.x, world.start.y)
  return { world, board, crates, start, report: solveBoard(board, crates, start, budget) }
}

function dropOntoGoal(): void {
  const rows = ['#####', '#=%.#', '#...#', '#####']
  const overlay = ['.....', '.@.R.', '.....', '.....']
  const { report, world } = solveAscii(rows, overlay)
  check('ledge drop solves', report.verdict === 'solved' && report.pushes === 1, `${report.verdict} ${report.pushes}`)
  check('ledge drop is a fall', report.pushPath?.[0]?.fell === true)
  const oracle = oracleSolve(world, 200000)
  check('ledge drop matches oracle', oracle.pushes === 1, `${oracle.pushes}`)
}

const STRANDED_WITH_STEP = ['#######', '#.===.#', '#.=%=.#', '#.b...#', '#.....#', '#######']
const STRANDED_STEP_AWAY = ['#######', '#.===.#', '#.=%=.#', '#.....#', '#b....#', '#######']
const STRANDED_OVERLAY = ['.......', '.......', '.......', '...R...', '....@..', '.......']

function strandedLedge(): void {
  const solvable = solveAscii(STRANDED_WITH_STEP, STRANDED_OVERLAY)
  check(
    'step crate in place solves',
    solvable.report.verdict === 'solved' && solvable.report.pushes === 1,
    `${solvable.report.verdict} ${solvable.report.pushes}`,
  )

  const trap = solveAscii(STRANDED_STEP_AWAY, STRANDED_OVERLAY)
  check('stranded ledge is provably unsolvable', trap.report.verdict === 'provablyUnsolvable', trap.report.verdict)
  check('stranded ledge is proved at the root', trap.report.nodesUsed === 0, `${trap.report.nodesUsed} nodes`)
  const oracle = oracleSolve(trap.world, 400000)
  check('stranded ledge matches oracle', oracle.finished && oracle.pushes === null, `${oracle.pushes}`)

  const phys = createPhysics(trap.board)
  stampCrates(phys, trap.crates)
  const reach = flood(phys, trap.start)
  const analyses = ledgeAnalyses(trap.board)
  check('one ledge component', analyses.length === 1, `${analyses.length}`)
  const cells = trap.crates.map((crate) => crate.cell)
  check('ledge is proved unreachable', analyses.every((analysis) => unreachableLedge(analysis, cells, reach)))
}

function colorMismatch(): void {
  const rows = ['######', '#@.r.#', '#...b#', '#....#', '######']
  const overlay = ['......', '....B.', '......', '....R.', '......']
  const { report, world, board, crates, start } = solveAscii(rows, overlay)
  check('color mismatch is unsolvable', report.verdict === 'provablyUnsolvable', report.verdict)
  check('color mismatch is proved at the root', report.nodesUsed === 0, `${report.nodesUsed} nodes`)
  const oracle = oracleSolve(world, 400000)
  check('color mismatch matches oracle', oracle.finished && oracle.pushes === null, `${oracle.pushes}`)
  const blind = solveBoardColorBlind(board, crates, start, 200000)
  check('same room solves color blind', blind.verdict === 'solved' && blind.pushes === 2, `${blind.verdict} ${blind.pushes}`)
}

const CANON_ROWS = ['#######', '#.==r.#', '#r.r..#', '#.#...#', '#######']
const CANON_OVERLAY = ['.......', '...@R..', '.R.....', '.R.....', '.......']

function canonicalPlayer(): void {
  const { board, crates, start, report, world } = solveAscii(CANON_ROWS, CANON_OVERLAY)
  const phys = createPhysics(board)
  stampCrates(phys, crates)
  const pocket = flood(phys, 15, 0)
  const whole = flood(phys, 11, 1)
  check('pocket and room share a lowest reachable cell', pocket.minCell === whole.minCell, `${pocket.minCell} vs ${whole.minCell}`)
  check('their reachable sets differ', pocket.count !== whole.count, `${pocket.count} vs ${whole.count}`)
  check('colliding room solves', report.verdict === 'solved' && report.pushes === 5, `${report.verdict} ${report.pushes}`)
  const oracle = oracleSolve(world, 400000)
  check('colliding room matches oracle', oracle.pushes === report.pushes, `${oracle.pushes} vs ${report.pushes}`)
  const naive = solveBoard(board, crates, start, { nodeBudget: 200000, playerKey: 'minCell' })
  check('lowest-cell keys would have failed here', naive.verdict === 'provablyUnsolvable', naive.verdict)
}

const BIG_ROWS = ['#######', '#.....#', '#.=%=.#', '#.b...#', '#...r.#', '#.....#', '#######']
const BIG_OVERLAY = ['.......', '.......', '.....R.', '.B.....', '.......', '.@..R..', '.......']

function threeCrateTiming(): void {
  const started = Date.now()
  const { report, world, board, crates, start } = solveAscii(BIG_ROWS, BIG_OVERLAY, 400000)
  const elapsed = Date.now() - started
  const blindStarted = Date.now()
  const blind = solveBoardColorBlind(board, crates, start, 400000)
  console.log(
    `3-crate 7x7 color blind: verdict=${blind.verdict} pushes=${blind.pushes} ` +
      `nodes=${blind.nodesUsed} ms=${Date.now() - blindStarted}`,
  )
  check('color blind never needs more pushes', (blind.pushes ?? 0) <= (report.pushes ?? 0), `${blind.pushes}`)
  console.log(
    `3-crate 7x7: verdict=${report.verdict} pushes=${report.pushes} nodes=${report.nodesUsed} ms=${elapsed}`,
  )
  check('3-crate room solves', report.verdict === 'solved', report.verdict)
  const oracle = oracleSolve(world, 2000000)
  check('3-crate room matches oracle', oracle.pushes === report.pushes, `${oracle.pushes} vs ${report.pushes}`)
}

function staticAnalyses(): void {
  const rows = ['######', '#....#', '#.==.#', '#..r.#', '######']
  const overlay = ['......', '......', '......', '....R.', '......']
  const { board, crates } = solveAscii(rows, overlay)
  const alive = aliveByColor(board)
  check('the red goal is red alive', alive[0][3 * 6 + 4] === 1)
  check('the goal cell is not blue alive', alive[1][3 * 6 + 4] === 0)
  check('a wall is alive for nobody', alive[0][0] === 0)

  const distance = colorDistance(board)
  check('distance to the red goal is zero at the goal', distance[0][3 * 6 + 4] === 0, `${distance[0][3 * 6 + 4]}`)
  check('distance grows by walk steps', distance[0][3 * 6 + 3] === 1, `${distance[0][3 * 6 + 3]}`)
  check('a color with no goals is unreached', distance[1][3 * 6 + 3] === UNREACHED)

  const [ledge] = ledgeAnalyses(board)
  const stairs = potentialStairs(board, ledge!.component)
  check('two ledge cells', ledge!.component.cells.length === 2, `${ledge!.component.cells.length}`)
  check('stairs are the floor cells beside the ledge', stairs.every((cell) => board.height[cell] === 0))
  check('the crate cell is a stair', stairs.includes(3 * 6 + 3), `${stairs}`)

  check('a crate in the open is not frozen', !frozen(board, crates, 3 * 6 + 3))
  const cornered = [{ cell: 3 * 6 + 1, color: 'red' as const }]
  check('a crate in a corner is frozen', frozen(board, cornered, 3 * 6 + 1))
  check('a red crate that cannot reach its goal is lost', lost(board, cornered, alive))
  check('the same crate on a live cell is not lost', !lost(board, crates, alive))
}

staticAnalyses()
randomRooms('small rooms', 200, { min: 5, max: 6, crates: 2, reach: 3 })
randomRooms('wider rooms', 60, { min: 6, max: 7, crates: 2, reach: 4 })
randomRooms('three crates', 20, { min: 7, max: 7, crates: 3, reach: 4 })
dropOntoGoal()
strandedLedge()
colorMismatch()
canonicalPlayer()
threeCrateTiming()

reportChecks()

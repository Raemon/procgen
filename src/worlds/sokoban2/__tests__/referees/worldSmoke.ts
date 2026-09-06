import { generateWorld2 } from '../../generate/generateWorld'
import { recordCertificatesInto, type RoomCertificate } from '../../generate/certificates'
import { CURRICULUM_IDS, RECIPES, RECIPE_IDS, type RecipeId } from '../../generate/recipes'
import { GEN_PARAMS } from '../../benchConfig'
import { DEFAULT_PARAMS, type GenParams } from '../../params'
import { makeBoard } from '../../puzzle/board'
import { solveBoard } from '../../puzzle/solver'
import { HEIGHT, type RoomPlan, type World } from '../../types'
import { check, checksRun, reportVerdict } from './checkRunner'
import { checkWorld } from './worldInvariants'

const configs: GenParams[] = [
  { ...DEFAULT_PARAMS },
  { ...DEFAULT_PARAMS, cols: 4, rows: 4, roomW: 9, roomH: 9, obstacleDensity: 0.2, ledgeChance: 0.8, colorMixStart: 0.1 },
  { ...DEFAULT_PARAMS, cols: 2, rows: 3, roomW: 5, roomH: 5, crossRoomStart: 0.1, crossRoomChance: 1, loopChance: 0.5 },
]
const WORLDS_PER_CONFIG = 6
const BENCH_WORLDS = 5

const BENCH_LEDGE_ROOMS = 3
const BENCH_MS_BUDGET = 5000

const REFEREE_BUDGET = 60000

const totals = { rooms: 0, crates: 0, goals: 0, deliveries: 0, importRooms: 0, ledgeRooms: 0 }
const shipped = new Map<string, number>()
const planned = new Map<string, number>()
const puzzle = { rooms: 0, empty: 0, traps: 0, pushes: 0, twoColorRooms: 0 }
const trapLedger = { certified: 0, credited: 0, wallHugs: 0 }

const bands: { credited: number[]; dependencies: number[] }[] = [
  { credited: [], dependencies: [] },
  { credited: [], dependencies: [] },
  { credited: [], dependencies: [] },
]
let certificates = 0
let maxMs = 0
let totalMs = 0

for (const [ci, params] of configs.entries()) {
  for (let s = 0; s < WORLDS_PER_CONFIG; s++) {
    const label = `cfg${ci} seed${s}`
    const ledger: RoomCertificate[] = []
    recordCertificatesInto(ledger)
    const world = generateWorld2(params, 1013 * (s + 1) + ci * 7919)
    recordCertificatesInto(null)
    maxMs = Math.max(maxMs, world.stats.generationMs)
    totalMs += world.stats.generationMs
    checkWorld(world, label)
    checkSyllabus(world, label)
    for (const certificate of ledger) refereeCertificate(certificate, label)
    for (const certificate of ledger) bandSample(world, certificate)
    certificates += ledger.length
    tallyRooms(world)
    totals.rooms += world.rooms.length
    totals.crates += world.crates.length
    totals.goals += world.goals.length
    totals.deliveries += world.deliveries.length
    totals.importRooms += world.stats.importRooms
    totals.ledgeRooms += world.stats.ledgeRooms
  }
}

const bench = runBench()
checkDeterminism()

check('the sweep built ledge rooms', totals.ledgeRooms > 0, `${totals.ledgeRooms}`)
check(
  'the bench ships ledge rooms by the handful',
  bench.ledgeRooms / bench.worlds >= BENCH_LEDGE_ROOMS,
  `${(bench.ledgeRooms / bench.worlds).toFixed(2)} per world < ${BENCH_LEDGE_ROOMS}`,
)
check('every bench world ships a ledge room or two', bench.minLedgeRooms >= 2, `${bench.minLedgeRooms}`)
check('the bench builds a world in under four seconds', bench.avgMs < BENCH_MS_BUDGET, `${bench.avgMs.toFixed(0)}ms`)
check('the sweep built two-color rooms', puzzle.twoColorRooms > 0, `${puzzle.twoColorRooms}`)
check(
  'every recipe the curriculum plans is taught somewhere, in the sweep or on the bench',
  CURRICULUM_IDS.every((id) => (planned.get(id) ?? 0) + (bench.shipped.get(id) ?? 0) > 0),
  `sweep ${recipeTable(planned)} | bench ${recipeTable(bench.shipped)}`,
)
check('shipped rooms cover most of the recipe book', RECIPE_IDS.filter((id) => (shipped.get(id) ?? 0) > 0).length >= 5, recipeTable(shipped))
check('the sweep certified rooms to referee', certificates > 0, `${certificates}`)
check('the bench teaches the keep-it-up lesson', (bench.shipped.get('R7') ?? 0) > 0, recipeTable(bench.shipped))
check(
  'credited traps climb along the curriculum more often than they fall',
  bench.ramp.climbs > bench.ramp.falls,
  `${bench.ramp.climbs} climbs vs ${bench.ramp.falls} falls`,
)
curriculumRamps()

console.log(
  `worlds=${configs.length * WORLDS_PER_CONFIG} rooms=${totals.rooms} crates=${totals.crates} goals=${totals.goals} ` +
    `deliveries=${totals.deliveries} importRooms=${totals.importRooms} ledgeRooms=${totals.ledgeRooms} certificates=${certificates}`,
)
console.log(`planned: ${recipeTable(planned)}`)
console.log(`shipped: ${recipeTable(shipped)}`)
console.log(
  `puzzle rooms ${puzzle.rooms}, empty ${(100 * puzzle.empty / (puzzle.rooms + puzzle.empty)).toFixed(0)}%, ` +
    `mean traps ${(puzzle.traps / Math.max(1, puzzle.rooms)).toFixed(2)}, mean minPushes ${(puzzle.pushes / Math.max(1, puzzle.rooms)).toFixed(2)}`,
)
console.log(
  `bench (5x5 rooms): ${bench.worlds} worlds, avgGenMs ${bench.avgMs.toFixed(0)}, maxGenMs ${bench.maxMs.toFixed(0)}, ` +
    `ledge rooms/world ${(bench.ledgeRooms / bench.worlds).toFixed(2)} (min ${bench.minLedgeRooms}), ` +
    `puzzle rooms ${bench.rooms}, empty ${(100 * bench.empty / (bench.rooms + bench.empty)).toFixed(0)}%, ` +
    `mean traps ${(bench.traps / Math.max(1, bench.rooms)).toFixed(2)}, mean minPushes ${(bench.pushes / Math.max(1, bench.rooms)).toFixed(2)}`,
)
console.log(
  `certified traps ${trapLedger.certified}, credited ${trapLedger.credited} ` +
    `(${(100 * trapLedger.credited / Math.max(1, trapLedger.certified)).toFixed(0)}%), wall-hugs banked ${trapLedger.wallHugs}`,
)
console.log(`bench shipped: ${recipeTable(bench.shipped)}`)
console.log(`bench syllabus: ${bench.motifs.size} distinct lessons, ${bench.repeats} repeats, ramp ${bench.ramp.climbs} climbs / ${bench.ramp.flats} flats / ${bench.ramp.falls} falls`)
console.log(`checks=${checksRun()} maxGenMs=${maxMs.toFixed(1)} avgGenMs=${(totalMs / (configs.length * WORLDS_PER_CONFIG)).toFixed(1)}`)
reportVerdict()

function recipeTable(counts: Map<string, number>): string {
  return RECIPE_IDS.map((id) => `${id} ${counts.get(id) ?? 0}`).join(', ')
}

function isShipped(room: RoomPlan): boolean {
  return room.traps !== null && room.concept !== 'empty'
}

function tallyRooms(world: World): void {
  for (const room of world.rooms) {
    planned.set(room.recipeId, (planned.get(room.recipeId) ?? 0) + 1)
    if (!isShipped(room)) {
      puzzle.empty++
      continue
    }
    puzzle.rooms++
    puzzle.traps += room.traps ?? 0
    puzzle.pushes += room.minPushes ?? 0
    shipped.set(room.recipeId, (shipped.get(room.recipeId) ?? 0) + 1)
    if (new Set(room.goals.map((goal) => goal.color)).size > 1) puzzle.twoColorRooms++
  }
}

interface Ramp {
  climbs: number
  flats: number
  falls: number
}

interface BenchResult {
  worlds: number
  avgMs: number
  maxMs: number
  rooms: number
  empty: number
  traps: number
  pushes: number
  ledgeRooms: number
  minLedgeRooms: number
  shipped: Map<string, number>
  motifs: Set<string>
  repeats: number
  ramp: Ramp
}

function runBench(): BenchResult {
  const out: BenchResult = {
    worlds: BENCH_WORLDS,
    avgMs: 0,
    maxMs: 0,
    rooms: 0,
    empty: 0,
    traps: 0,
    pushes: 0,
    ledgeRooms: 0,
    minLedgeRooms: Number.MAX_SAFE_INTEGER,
    shipped: new Map<string, number>(),
    motifs: new Set<string>(),
    repeats: 0,
    ramp: { climbs: 0, flats: 0, falls: 0 },
  }
  let total = 0
  for (let seed = 1; seed <= BENCH_WORLDS; seed++) {
    const world = generateWorld2(GEN_PARAMS, seed)
    total += world.stats.generationMs
    sampleBenchWorld(out, world, `bench seed${seed}`)
  }
  out.avgMs = total / BENCH_WORLDS
  return out
}

function sampleBenchWorld(out: BenchResult, world: World, label: string): void {
  checkWorld(world, label)
  const taught = checkSyllabus(world, label)
  for (const motif of taught.motifs) out.motifs.add(motif)
  out.repeats += taught.repeats
  out.ramp.climbs += taught.ramp.climbs
  out.ramp.flats += taught.ramp.flats
  out.ramp.falls += taught.ramp.falls
  out.maxMs = Math.max(out.maxMs, world.stats.generationMs)
  out.ledgeRooms += world.stats.ledgeRooms
  out.minLedgeRooms = Math.min(out.minLedgeRooms, world.stats.ledgeRooms)
  tallyBenchRooms(out, world)
}

function tallyBenchRooms(out: BenchResult, world: World): void {
  for (const room of world.rooms) {
    if (!isShipped(room)) {
      out.empty++
      continue
    }
    out.rooms++
    out.traps += room.traps ?? 0
    out.pushes += room.minPushes ?? 0
    out.shipped.set(room.recipeId, (out.shipped.get(room.recipeId) ?? 0) + 1)
  }
}

function checkSyllabus(world: World, label: string): { motifs: Set<string>; repeats: number; ramp: Ramp } {
  const rooms = [...world.rooms].sort((a, b) => a.depth - b.depth || a.id - b.id).filter(isShipped)
  const trapsByMotif = new Map<string, number[]>()
  for (const room of rooms) {
    check('a shipped room carries a lesson', room.motif !== 'none' && room.motif.startsWith('R') || room.motif.startsWith('dock+'), `${label} room${room.id}: ${room.motif}`)
    trapsByMotif.set(room.motif, [...(trapsByMotif.get(room.motif) ?? []), room.traps ?? 0])
  }
  let repeats = 0
  for (const [motif, traps] of trapsByMotif) {
    repeats += traps.length - 1
    check('a repeated lesson banks strictly more traps each time', new Set(traps).size === traps.length, `${label} ${motif}: ${traps.join(',')}`)
  }
  const ramp: Ramp = { climbs: 0, flats: 0, falls: 0 }
  for (let index = 1; index < rooms.length; index++) {
    const step = (rooms[index]!.traps ?? 0) - (rooms[index - 1]!.traps ?? 0)
    if (step > 0) ramp.climbs++
    else if (step === 0) ramp.flats++
    else ramp.falls++
  }
  return { motifs: new Set(trapsByMotif.keys()), repeats, ramp }
}

function refereeCertificate(certificate: RoomCertificate, label: string): void {
  const board = makeBoard(certificate.w, certificate.h, certificate.heights, certificate.goals)
  const where = `${label} room${certificate.roomId} ${certificate.recipeId}`
  const solved = solveBoard(board, certificate.crates, certificate.player, REFEREE_BUDGET)
  check('certified room is solvable as shipped', solved.verdict === 'solved', `${where}: ${solved.verdict}`)
  for (const ledge of certificate.ledgeCells) {
    check('certified ledge cell is two high', certificate.heights[ledge] === HEIGHT.Ledge, `${where} cell${ledge}`)
  }
  for (const trap of certificate.traps) {
    const after = solveBoard(board, trap.cratesAfter, trap.playerAfter, REFEREE_BUDGET)
    check(
      'certified trap state is lost',
      after.verdict === 'provablyUnsolvable',
      `${where} ${trap.kind}/${trap.proof}: ${after.verdict}`,
    )
    const before = solveBoard(board, trap.cratesBefore, trap.playerBefore, REFEREE_BUDGET)
    check(
      'certified trap is tempted from a winnable room',
      before.verdict === 'solved',
      `${where} ${trap.kind}/${trap.proof}: before was ${before.verdict}`,
    )
  }
  refereeWallHugs(certificate, where)
}

function refereeWallHugs(certificate: RoomCertificate, where: string): void {
  const banked = certificate.traps.filter((trap) => trap.credited && trap.wallHug)
  check('a room banks at most one wall-hug', banked.length <= 1, `${where}: ${banked.length}`)
  const tier = RECIPES[certificate.recipeId as RecipeId]?.tier ?? 0
  check('only beginner rooms bank a wall-hug', banked.length === 0 || tier <= 1, `${where}: tier ${tier}`)
}

function bandSample(world: World, certificate: RoomCertificate): void {
  trapLedger.certified += certificate.traps.length
  trapLedger.credited += certificate.traps.filter((trap) => trap.credited).length
  trapLedger.wallHugs += certificate.traps.filter((trap) => trap.credited && trap.wallHug).length
  const room = world.rooms.find((candidate) => candidate.id === certificate.roomId)
  if (!room) return
  const ratio = room.depth / Math.max(1, world.stats.maxDepth)
  const band = bands[Math.min(2, Math.floor(ratio * 3))]
  band!.credited.push(certificate.trapCredit)
  band!.dependencies.push(certificate.dependencies)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

function curriculumRamps(): void {
  const filled = bands.filter((band) => band.credited.length > 0)
  const shape = bands
    .map((band, index) => `band${index} n=${band.credited.length} traps ${median(band.credited)} deps ${median(band.dependencies)}`)
    .join(' | ')
  console.log(`curriculum ramp: ${shape}`)
  for (let index = 1; index < filled.length; index++) {
    const rising = (pick: (band: { credited: number[]; dependencies: number[] }) => number[]): boolean =>
      median(pick(filled[index]!)) >= median(pick(filled[index - 1]!))
    check('credited traps do not fall with depth', rising((band) => band.credited), shape)
    check('dependencies do not fall with depth', rising((band) => band.dependencies), shape)
  }
}

function checkDeterminism(): void {
  for (const [ci, params] of configs.entries()) {
    const seed = 4242 + ci
    const a = generateWorld2(params, seed)
    const b = generateWorld2(params, seed)
    check('deterministic tiles', a.tiles.join() === b.tiles.join(), `cfg${ci}`)
    check('deterministic heights', a.heights.join() === b.heights.join(), `cfg${ci}`)
    check('deterministic rooms', a.roomIds.join() === b.roomIds.join(), `cfg${ci}`)
    check('deterministic crates', JSON.stringify(a.crates) === JSON.stringify(b.crates), `cfg${ci}`)
    check('deterministic goals', JSON.stringify(a.goals) === JSON.stringify(b.goals), `cfg${ci}`)
    check('deterministic start', JSON.stringify(a.start) === JSON.stringify(b.start), `cfg${ci}`)
  }
}


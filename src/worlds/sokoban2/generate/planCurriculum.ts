import type { Rng } from '../rng'
import type { Layout } from './layout'
import type { GenParams } from '../params'
import { COLORS, type CrateColor } from '../types'
import type { Lever } from '../puzzle/reverse/reverseRun'
import type { RoomBrief2 } from './briefs'
import { RECIPES, type Recipe, type RecipeId, needsLedge } from './recipes'
import { SYLLABUS, motifKey, motifRank, type Motif } from './syllabus'

export interface Lesson {
  ratio: number

  trapTarget: number
  kind: 'puzzle' | 'import'
  recipe: RecipeId

  localRecipe: RecipeId

  wantsLedge: boolean
  brief: RoomBrief2
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const BIG_ROOM_CELLS = 50

const DEPENDENCY_RATIO = 0.5

const DRAW_FROM = 5
const LEVERS: Lever[] = ['plain', 'decoy', 'pocket']

function jittered(ratio: number, jitter: number, rng: Rng): number {
  return clamp(ratio + (2 * rng.next() - 1) * jitter, 0, 1)
}

export function planCurriculum(layout: Layout, params: GenParams, rng: Rng): Lesson[] {
  const lessons: Lesson[] = new Array(layout.rooms.length)
  const uses = new Map<Motif, number>()
  for (const [position, roomId] of layout.order.entries()) {
    const room = layout.rooms[roomId]
    const ratio = jittered(placeRatio(position, layout.order.length, params.difficultyRamp), params.lessonJitter, rng)
    const twoColors = ratio >= params.colorMixStart
    const motif = pickMotif(fittingLessons(ratio, room!.cells.length, twoColors, params), uses, ratio, params, rng)
    const repeats = uses.get(motif) ?? 0
    uses.set(motif, repeats + 1)
    const dock = wantsImport(room!.depth, ratio, params, rng)
    const lever = motif.mixed ? rng.pick(LEVERS) : 'plain'
    lessons[roomId] = lessonFor(motif, lever, dock, repeats, room!.cells.length, ratio, params)
  }
  return lessons
}

export function replanRoutelessImports(lessons: Lesson[], layout: Layout, params: GenParams): number[] {
  const replanned: number[] = []
  for (const [roomId, lesson] of lessons.entries()) {
    if (lesson.kind !== 'import' || lesson.brief.imports > 0) continue
    const room = layout.rooms[roomId]
    const brief = lesson.brief
    lessons[roomId] = lessonFor(motifOf(brief), brief.lever ?? 'plain', false, brief.repeats, room!.cells.length, lesson.ratio, params)
    replanned.push(roomId)
  }
  return replanned
}

function motifOf(brief: RoomBrief2): Motif {
  const mixed = (brief.localColors ?? []).length > 1
  const found = SYLLABUS.find(
    (motif) =>
      motif.recipe === brief.recipeId &&
      (motif.shape ?? undefined) === brief.shape &&
      motif.crates === brief.crateCount &&
      motif.mixed === mixed,
  )
  return found ?? SYLLABUS[1]!
}

function fittingLessons(ratio: number, area: number, twoColors: boolean, params: GenParams): Motif[] {
  const hostable = SYLLABUS.filter((motif) => {
    if (motif.mixed && !twoColors) return false
    return motif.crates <= Math.min(crateCap(area, densityFor(ratio, params)), params.maxCrates)
  })
  const opened = hostable.filter((motif) => ratio >= motif.window[0])
  const inWindow = opened.filter((motif) => ratio <= motif.window[1])
  return inWindow.length > 0 ? inWindow : opened.length > 0 ? opened : hostable
}

function pickMotif(fitting: Motif[], uses: Map<Motif, number>, ratio: number, params: GenParams, rng: Rng): Motif {
  const fresh = fitting.filter((motif) => !uses.has(motif))
  const pool = fresh.length > 0 ? fresh : leastRepeated(fitting.filter((motif) => motif.recipe !== 'R0'), uses)
  if (pool.length === 0) return SYLLABUS[1]!
  const ledged = pool.filter((motif) => motif.shape !== null)
  const flat = pool.filter((motif) => motif.shape === null)
  const group = ledged.length > 0 && flat.length > 0 ? (wantsLedge(ratio, params, rng) ? ledged : flat) : pool
  const easiest = [...group].sort((a, b) => motifRank(a) - motifRank(b)).slice(0, DRAW_FROM)
  return rng.pick(easiest)
}

function leastRepeated(fitting: Motif[], uses: Map<Motif, number>): Motif[] {
  if (fitting.length === 0) return []
  const fewest = Math.min(...fitting.map((motif) => uses.get(motif) ?? 0))
  return fitting.filter((motif) => (uses.get(motif) ?? 0) === fewest)
}

function wantsLedge(ratio: number, params: GenParams, rng: Rng): boolean {
  return rng.bool(clamp(params.ledgeChance * lerp(1.1, 2.2, ratio), 0, 1))
}

function wantsImport(depth: number, ratio: number, params: GenParams, rng: Rng): boolean {
  return depth >= 1 && ratio >= params.crossRoomStart && rng.bool(params.crossRoomChance)
}

function crateCap(area: number, density: number): number {
  return area * (1 - density) > BIG_ROOM_CELLS ? 2 : 3
}

function lessonFor(motif: Motif, lever: Lever, dock: boolean, repeats: number, area: number, ratio: number, params: GenParams): Lesson {
  const local = RECIPES[motif.recipe]
  const recipe = dock ? RECIPES.R6 : local
  const imports = dock ? 1 : 0
  const colors: CrateColor[] = motif.mixed ? [...COLORS] : [COLORS[0]!]
  const spare = COLORS.find((color) => !colors.includes(color))
  const brief = briefFor(local, motif, lever, area, ratio, params, imports)
  return {
    ratio,
    trapTarget: brief.trapTarget,
    kind: recipe.kind,
    recipe: recipe.id,
    localRecipe: local.id,
    wantsLedge: needsLedge(local),
    brief: {
      ...brief,
      recipeId: recipe.id,
      label: recipe.label,
      localColors: colors,
      importColors: imports > 0 && spare ? new Array<CrateColor>(imports).fill(spare) : undefined,
      motif: motifKey(motif, dock),
      repeats,
    },
  }
}

function briefFor(recipe: Recipe, motif: Motif, lever: Lever, area: number, ratio: number, params: GenParams, imports: number): RoomBrief2 {
  const ledge = needsLedge(recipe)
  const crateCount = clamp(motif.crates, recipe.crates[0], Math.min(crateCeiling(recipe), crateCap(area, densityFor(ratio, params)), params.maxCrates))
  return {
    recipeId: recipe.id,
    label: recipe.label,
    tier: clamp(Math.round(ratio * 3), 0, 3),
    crateCount,

    obstacleDensity: densityFor(ratio, params) - (ledge ? 0.05 : 0),
    pullEffort: Math.max(14, Math.round(params.pullEffort * lerp(1, 1.6, ratio))),
    imports,

    trapTarget: crateCount > 1 ? 2 + Math.round(ratio) : 1,
    familyTarget: 1 + Math.round(ratio),
    dependencyTarget: ratio >= DEPENDENCY_RATIO ? 1 : 0,
    shape: motif.shape ?? undefined,
    lever,
    motif: motifKey(motif, false),
    repeats: 0,
  }
}

export function crateCeiling(recipe: Recipe): number {
  return recipe.crates[1] + (recipe.tier > 0 && recipe.kind === 'puzzle' && !needsLedge(recipe) ? 1 : 0)
}

function densityFor(ratio: number, params: GenParams): number {
  return clamp(params.obstacleDensity * lerp(1.2, 2, ratio), 0.06, 0.16)
}

function placeRatio(position: number, roomCount: number, ramp: number): number {
  const raw = roomCount <= 1 ? 0 : position / (roomCount - 1)
  return ramp * raw + (1 - ramp) * 0.5
}

export function summariseCurriculum(lessons: Lesson[]): string {
  const counts = new Map<string, number>()
  for (const lesson of lessons) {
    const label = lesson.kind === 'import' ? `R6 over ${lesson.localRecipe}` : `${lesson.recipe} ${lesson.brief.label}`
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts].map(([label, count]) => `${count}x ${label}`).join(', ')
}

export function syllabusLine(lessons: Lesson[], layout: Layout): string {
  return layout.order.map((roomId) => `${roomId}:${lessons[roomId]!.brief.motif}${lessons[roomId]!.brief.repeats > 0 ? '*' : ''}`).join(' ')
}

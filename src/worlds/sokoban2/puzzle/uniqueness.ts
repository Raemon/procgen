import { HEIGHT, type Vec } from '../types'

export interface FingerprintGroups {
  ledges: Vec[]
  redGoals: Vec[]
  blueGoals: Vec[]
  redCrates: Vec[]
  blueCrates: Vec[]

  trapMouths: Vec[]

  landings?: Vec[]
}

export interface KeyDims {
  w: number
  h: number
  height?: ArrayLike<number>
}

type Transform = (point: Vec) => Vec

export function canonicalKey(dims: KeyDims, schemaId: string, groups: FingerprintGroups): string {
  const full = { ...groups, landings: groups.landings ?? landingsOf(dims) }
  const variants: string[] = []
  for (const transform of symmetries(dims)) {
    for (const swapped of [false, true]) variants.push(render(full, transform, swapped))
  }
  variants.sort()
  return `${schemaId}#${variants[0]}`
}

function landingsOf(dims: KeyDims): Vec[] {
  const height = dims.height
  if (!height) return []
  const landings: Vec[] = []
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= dims.w || y >= dims.h ? -1 : height[y * dims.w + x])
  for (let y = 0; y < dims.h; y++) {
    for (let x = 0; x < dims.w; x++) {
      if (at(x, y) !== HEIGHT.Floor) continue
      const drop = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => at(x + dx!, y + dy!) === HEIGHT.Ledge && at(x + dx! * 2, y + dy! * 2) === HEIGHT.Ledge)
      if (drop) landings.push({ x, y })
    }
  }
  return landings
}

function symmetries(dims: { w: number; h: number }): Transform[] {
  const { w, h } = dims
  return [
    (p) => ({ x: p.x, y: p.y }),
    (p) => ({ x: w - 1 - p.x, y: p.y }),
    (p) => ({ x: p.x, y: h - 1 - p.y }),
    (p) => ({ x: w - 1 - p.x, y: h - 1 - p.y }),
    (p) => ({ x: p.y, y: p.x }),
    (p) => ({ x: h - 1 - p.y, y: p.x }),
    (p) => ({ x: p.y, y: w - 1 - p.x }),
    (p) => ({ x: h - 1 - p.y, y: w - 1 - p.x }),
  ]
}

function ordered(groups: Required<FingerprintGroups>, swapped: boolean): Vec[][] {
  const { ledges, landings, redGoals, blueGoals, redCrates, blueCrates, trapMouths } = groups
  if (!swapped) return [ledges, landings, redGoals, blueGoals, redCrates, blueCrates, trapMouths]
  return [ledges, landings, blueGoals, redGoals, blueCrates, redCrates, trapMouths]
}

const MOUTH_GROUP = 6

function render(groups: Required<FingerprintGroups>, transform: Transform, swapped: boolean): string {
  const moved = ordered(groups, swapped).map((group) => group.map(transform))
  const flat = moved.flat()
  const minX = flat.length > 0 ? Math.min(...flat.map((point) => point.x)) : 0
  const minY = flat.length > 0 ? Math.min(...flat.map((point) => point.y)) : 0
  const spell = (point: Vec) => `${point.x - minX},${point.y - minY}`
  return moved
    .map((group, index) => (index === MOUTH_GROUP ? pairsOf(group, spell) : group.map(spell)).sort().join(';'))
    .join('|')
}

function pairsOf(group: Vec[], spell: (point: Vec) => string): string[] {
  const out: string[] = []
  for (let index = 0; index < group.length; index += 2) {
    const next = group[index + 1]
    out.push(next ? `${spell(group[index]!)}>${spell(next)}` : spell(group[index]!))
  }
  return out
}

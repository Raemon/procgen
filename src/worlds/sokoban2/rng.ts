export interface Rng {
  next(): number

  int(min: number, max: number): number
  bool(chance: number): boolean
  pick<T>(items: readonly T[]): T

  shuffle<T>(items: readonly T[]): T[]

  weighted<T>(items: readonly T[], weight: (item: T) => number): T
}

function hashString(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function makeRng(seed: number): Rng {
  let state = (seed >>> 0) || 0x9e3779b9

  const next = () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    bool: (chance) => next() < chance,
    pick: (items) => items[Math.floor(next() * items.length)]!,
    shuffle: (items) => {
      const copy = items.slice()
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        const swapped = copy[i]!
        copy[i] = copy[j]!
        copy[j] = swapped
      }
      return copy
    },
    weighted: (items, weight) => {
      const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0)
      if (total <= 0) return rng.pick(items)
      let roll = next() * total
      for (const item of items) {
        roll -= Math.max(0, weight(item))
        if (roll <= 0) return item
      }
      return items[items.length - 1]!
    },
  }
  return rng
}

export function derive(seed: number, label: string): Rng {
  return makeRng((seed ^ hashString(label)) >>> 0)
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000)
}

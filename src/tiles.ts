// The tileset: what a tile IS (name, glyph, color, walkability) plus a stable
// numeric id the grid stores and a `role` the generator targets. Roles are how
// the generator survives renames and deletions — it asks for "water", not for
// tile #0, and a missing role simply means that pass places nothing.

export type TileRole = 'water' | 'sand' | 'grass' | 'tree' | 'rock';

export interface TileDef {
  /** Stable numeric id; what Grid cells store. Never reused after deletion. */
  id: number;
  name: string;
  /** One character, as the ascii view draws it. */
  symbol: string;
  /** CSS hex color. */
  color: string;
  walkable: boolean;
  /** Which generator slot this tile fills, if any. Set on the seeded defaults;
   *  user-added tiles have none (until a future rule editor assigns them). */
  role: TileRole | null;
}

const STORAGE_KEY = 'procgen.tileset.v1';

function defaults(): TileDef[] {
  return [
    { id: 0, name: 'water', symbol: '~', color: '#3a6ea5', walkable: false, role: 'water' },
    { id: 1, name: 'sand', symbol: '.', color: '#d8c07a', walkable: true, role: 'sand' },
    { id: 2, name: 'grass', symbol: '"', color: '#5a8f4e', walkable: true, role: 'grass' },
    { id: 3, name: 'tree', symbol: '♠', color: '#2d6a34', walkable: false, role: 'tree' },
    { id: 4, name: 'rock', symbol: '#', color: '#7a7a72', walkable: false, role: 'rock' },
  ];
}

export class Tileset {
  private tiles: TileDef[];
  private nextId: number;
  private listeners = new Set<() => void>();

  constructor() {
    const loaded = load();
    this.tiles = loaded ?? defaults();
    this.nextId = this.tiles.reduce((m, t) => Math.max(m, t.id + 1), 0);
  }

  /** In display order. Treat as read-only; mutate through the methods below. */
  all(): readonly TileDef[] {
    return this.tiles;
  }

  byId(id: number): TileDef | undefined {
    return this.tiles.find((t) => t.id === id);
  }

  /** The tile filling a generator role, or undefined if none does. */
  byRole(role: TileRole): TileDef | undefined {
    return this.tiles.find((t) => t.role === role);
  }

  idForRole(role: TileRole): number {
    return this.byRole(role)?.id ?? -1;
  }

  add(): TileDef {
    const t: TileDef = {
      id: this.nextId++,
      name: `tile ${this.nextId}`,
      symbol: '?',
      color: '#888888',
      walkable: true,
      role: null,
    };
    this.tiles.push(t);
    this.changed();
    return t;
  }

  remove(id: number): void {
    this.tiles = this.tiles.filter((t) => t.id !== id);
    this.changed();
  }

  update(id: number, patch: Partial<Omit<TileDef, 'id' | 'role'>>): void {
    const t = this.byId(id);
    if (!t) return;
    Object.assign(t, patch);
    this.changed();
  }

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  private changed(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tiles));
    } catch {
      // Storage unavailable: the session still works, it just won't persist.
    }
    for (const fn of this.listeners) fn();
  }
}

function load(): TileDef[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.filter(
      (t): t is TileDef =>
        typeof t === 'object' &&
        t !== null &&
        typeof (t as TileDef).id === 'number' &&
        typeof (t as TileDef).name === 'string' &&
        typeof (t as TileDef).symbol === 'string' &&
        typeof (t as TileDef).color === 'string' &&
        typeof (t as TileDef).walkable === 'boolean',
    );
  } catch {
    return null;
  }
}

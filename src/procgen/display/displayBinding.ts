import type { ValueKind } from '../values/chunkValues';

export const RANDOM_ROTATION = -1;

export type DisplayBinding =
  | { mode: 'hidden' }
  | { mode: 'tileLayer' }
  | { mode: 'elevation'; heightScale: number }
  | { mode: 'markers'; tileId: number; glyph: string; color: string }
  | { mode: 'prefabs'; prefabId: number; rotation: number }
  | { mode: 'creatures'; creatureId: number }
  | { mode: 'items'; itemId: number };

export type DisplayMode = DisplayBinding['mode'];

export function displayModesForKind(kind: ValueKind): DisplayMode[] {
  if (kind === 'field') return ['hidden', 'elevation'];
  if (kind === 'tiles') return ['tileLayer', 'hidden'];
  return ['markers', 'prefabs', 'creatures', 'items', 'hidden'];
}

export function defaultBindingForMode(mode: DisplayMode): DisplayBinding {
  if (mode === 'elevation') return { mode, heightScale: 3 };
  if (mode === 'markers') return { mode, tileId: -1, glyph: '*', color: '#ff5577' };
  if (mode === 'prefabs') return { mode, prefabId: -1, rotation: RANDOM_ROTATION };
  if (mode === 'creatures') return { mode, creatureId: -1 };
  if (mode === 'items') return { mode, itemId: -1 };
  return { mode };
}

export function defaultBindingForKind(kind: ValueKind): DisplayBinding {
  return defaultBindingForMode(displayModesForKind(kind)[0]!);
}

export function isBindingValidForKind(binding: DisplayBinding, kind: ValueKind): boolean {
  return displayModesForKind(kind).includes(binding.mode);
}

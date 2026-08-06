import type { ValueKind } from '../values/chunkValues';

export type DisplayBinding =
  | { mode: 'hidden' }
  | { mode: 'tileLayer' }
  | { mode: 'elevation'; heightScale: number }
  | { mode: 'markers'; glyph: string; color: string };

export type DisplayMode = DisplayBinding['mode'];

export function displayModesForKind(kind: ValueKind): DisplayMode[] {
  if (kind === 'field') return ['hidden', 'elevation'];
  if (kind === 'tiles') return ['tileLayer', 'hidden'];
  return ['markers', 'hidden'];
}

export function defaultBindingForMode(mode: DisplayMode): DisplayBinding {
  if (mode === 'elevation') return { mode, heightScale: 3 };
  if (mode === 'markers') return { mode, glyph: '*', color: '#ff5577' };
  return { mode };
}

export function defaultBindingForKind(kind: ValueKind): DisplayBinding {
  return defaultBindingForMode(displayModesForKind(kind)[0]!);
}

export function isBindingValidForKind(binding: DisplayBinding, kind: ValueKind): boolean {
  return displayModesForKind(kind).includes(binding.mode);
}

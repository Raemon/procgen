import {
  NO_CREATURE,
  NO_CULTURE,
  NO_ITEM,
  NO_PIECE,
  NO_TILE,
  type CreatureId,
  type CultureId,
  type ItemId,
  type PieceId,
  type TileId,
} from '@/features/asset-library/asset';
import type { ValueKind } from '../values/chunkValues';

export const RANDOM_ROTATION = -1;
export { NO_CULTURE } from '@/features/asset-library/asset';

export type DisplayBinding =
  | { mode: 'hidden' }
  | { mode: 'tileLayer' }
  | { mode: 'ceiling'; height: number }
  | { mode: 'elevation'; heightScale: number }
  | { mode: 'markers'; tileId: TileId; glyph: string; color: string }
  | { mode: 'pieces'; pieceId: PieceId; rotation: number }
  | { mode: 'structures'; cultureId: CultureId }
  | { mode: 'creatures'; creatureId: CreatureId }
  | { mode: 'items'; itemId: ItemId };

export type DisplayMode = DisplayBinding['mode'];

export function displayModesForKind(kind: ValueKind): DisplayMode[] {
  if (kind === 'field') return ['hidden', 'elevation'];
  if (kind === 'tiles') return ['tileLayer', 'ceiling', 'hidden'];
  return ['markers', 'pieces', 'structures', 'creatures', 'items', 'hidden'];
}

export const DEFAULT_CEILING_HEIGHT = 2;
export const MAX_CEILING_HEIGHT = 16;

export function defaultBindingForMode(mode: DisplayMode): DisplayBinding {
  if (mode === 'ceiling') return { mode, height: DEFAULT_CEILING_HEIGHT };
  if (mode === 'elevation') return { mode, heightScale: 3 };
  if (mode === 'markers') return { mode, tileId: NO_TILE, glyph: '*', color: '#ff5577' };
  if (mode === 'pieces') return { mode, pieceId: NO_PIECE, rotation: RANDOM_ROTATION };
  if (mode === 'structures') return { mode, cultureId: NO_CULTURE };
  if (mode === 'creatures') return { mode, creatureId: NO_CREATURE };
  if (mode === 'items') return { mode, itemId: NO_ITEM };
  return { mode };
}

export function defaultBindingForKind(kind: ValueKind): DisplayBinding {
  return defaultBindingForMode(displayModesForKind(kind)[0]!);
}

export function isBindingValidForKind(binding: DisplayBinding, kind: ValueKind): boolean {
  return displayModesForKind(kind).includes(binding.mode);
}

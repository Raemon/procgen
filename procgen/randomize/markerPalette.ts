import type { RandomStream } from '../random/mulberry32';
import type { DisplayBinding } from '../display/displayBinding';
import { chance, pick } from './randomRolls';

const MARKER_TAGS = ['tree', 'monster', 'loot', 'shrine', 'crystal', 'ruin', 'spring', 'ghost'] as const;

const MARKER_GLYPHS = ['♠', '♣', '♦', '✶', '⚑', '▲', '◆', 'M', '☗', '✿'] as const;

const MARKER_COLORS = [
  '#2d6a34',
  '#ff4444',
  '#e0b040',
  '#7a5cff',
  '#3fbf9f',
  '#d268d2',
  '#c2c2c2',
  '#ff8c42',
] as const;

export function randomMarkerTag(rng: RandomStream): string {
  return pick(rng, MARKER_TAGS);
}

export function randomMarkerDisplay(rng: RandomStream, tileIds: readonly number[]): DisplayBinding {
  const tileSourced = tileIds.length > 0 && chance(rng, 0.4);
  return {
    mode: 'markers',
    tileId: tileSourced ? pick(rng, tileIds) : -1,
    glyph: pick(rng, MARKER_GLYPHS),
    color: pick(rng, MARKER_COLORS),
  };
}

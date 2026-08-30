import type { SpriteArt } from '../../tiles/spriteArt';

const KEY_ROWS = [
  '....bbbb....',
  '...bh..hb...',
  '..bh....hb..',
  '..bh....hb..',
  '...bh..hb...',
  '....bhhb....',
  '.....ss.....',
  '.....ss.....',
  '.....ss.....',
  '.....sstt...',
  '.....ss.....',
  '.....sstt...',
];

const KEY_PALETTE: Record<string, string> = {
  b: '#f0d488',
  h: '#e2bd63',
  s: '#c9a227',
  t: '#a8801f',
};

export function keySprite(): SpriteArt {
  return KEY_ROWS.flatMap((row) => [...row].map((key) => KEY_PALETTE[key] ?? null));
}

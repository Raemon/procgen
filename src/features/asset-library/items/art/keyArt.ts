import type { SpriteArt } from '../../tiles/spriteArt';
import { spriteFromPaintedRows } from '../../tiles/storage/paintedRowsArt';

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
  return spriteFromPaintedRows({ palette: KEY_PALETTE, rows: KEY_ROWS })!;
}

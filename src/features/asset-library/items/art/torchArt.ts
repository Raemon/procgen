import type { SpriteArt } from '../../tiles/spriteArt';
import { spriteFromPaintedRows } from '../../tiles/storage/paintedRowsArt';

const TORCH_ROWS = [
  '...ww...',
  '..wyyw..',
  '..yffy..',
  '...ff...',
  '...hh...',
  '...hh...',
  '...gg...',
  '...gg...',
];

const TORCH_PALETTE: Record<string, string> = {
  w: '#fff3c4',
  y: '#ffd166',
  f: '#ff8a1f',
  h: '#8a6a3c',
  g: '#5a3d22',
};

export function torchSprite(): SpriteArt {
  return spriteFromPaintedRows({ palette: TORCH_PALETTE, rows: TORCH_ROWS })!;
}

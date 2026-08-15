import type { SpriteArt } from '../../tiles/spriteArt';

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
  return TORCH_ROWS.flatMap((row) => [...row].map((key) => TORCH_PALETTE[key] ?? null));
}

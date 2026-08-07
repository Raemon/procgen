import type { SpriteArt } from '../../tiles/spriteArt';
import { spriteFromRows } from './spriteFromRows';

export function torchSprite(): SpriteArt {
  return spriteFromRows(
    [
      '...ww...',
      '..wyyw..',
      '..yffy..',
      '...ff...',
      '...hh...',
      '...hh...',
      '...gg...',
      '...gg...',
    ],
    { w: '#fff3c4', y: '#ffd166', f: '#ff8a1f', h: '#8a6a3c', g: '#5a3d22' },
  );
}

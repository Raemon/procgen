import {
  blankCubeFaceArt,
  CUBE_FACES,
  faceGridSize,
  type CubeFaceArt,
} from '../../tiles/tileFaceArt';
import type { SpriteArt } from '../../tiles/spriteArt';
import { spriteFromRows } from './spriteFromRows';

export function potionSprite(): SpriteArt {
  return spriteFromRows(
    [
      '...kk...',
      '...nn...',
      '..pppp..',
      '.pppppp.',
      '.pplppp.',
      '.pppppp.',
      '..pppp..',
      '........',
    ],
    { k: '#8a6a3c', n: '#a8c8d8', p: '#c0392b', l: '#ff9d8a' },
  );
}

export function swordSprite(): SpriteArt {
  return spriteFromRows(
    [
      '....b...',
      '...bb...',
      '...bb...',
      '...bb...',
      '...bb...',
      '..ggg...',
      '...h....',
      '...p....',
    ],
    { b: '#cfd6e0', g: '#8a6a3c', h: '#5a3d22', p: '#d9b04a' },
  );
}

export function shieldSprite(): SpriteArt {
  return spriteFromRows(
    [
      '.wwwwww.',
      'wwbbbbww',
      'wbbbbbbw',
      'wbbrrbbw',
      'wbbrrbbw',
      '.wbbbbw.',
      '..wbbw..',
      '...ww...',
    ],
    { w: '#9aa3ad', b: '#3a5c8a', r: '#d9b04a' },
  );
}

export function coinSprite(): SpriteArt {
  return spriteFromRows(
    [
      '..gggg..',
      '.gyyyyg.',
      'gyyllyyg',
      'gyllllyg',
      'gyllllyg',
      'gyyllyyg',
      '.gyyyyg.',
      '..gggg..',
    ],
    { g: '#a8801f', y: '#e8c14a', l: '#fff0a8' },
  );
}

export function runeSprite(): SpriteArt {
  return spriteFromRows(
    [
      '..ssss..',
      '.ssssss.',
      'sssmmsss',
      'ssmssmss',
      'ssmssmss',
      'sssmmsss',
      '.ssssss.',
      '..ssss..',
    ],
    { s: '#6f7a80', m: '#7ad9ff' },
  );
}

export function cubeArtFromSprite(sprite: SpriteArt): CubeFaceArt {
  const art = blankCubeFaceArt(faceGridSize(sprite));
  for (const face of CUBE_FACES) art[face] = [...sprite];
  return art;
}

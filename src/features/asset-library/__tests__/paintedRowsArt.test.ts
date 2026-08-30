import { spriteFrom } from '@/features/asset-library/items/itemCommands';
import { faceArtFrom } from '@/features/asset-library/tiles/tileCommands';
import {
  faceArtFromPaintedRows,
  spriteFromPaintedRows,
} from '@/features/asset-library/tiles/storage/paintedRowsArt';
import { spriteArtFromStoredShape } from '@/features/asset-library/tiles/storage/storedSpriteArt';
import { blankFacePixels } from '@/features/asset-library/tiles/tileFaceArt';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkPaintedRowsArt(check: CheckReporter): void {
  checkRowsPaintPixels(check);
  checkMistakesAreRefusedRatherThanGuessed(check);
  checkFaceArtRows(check);
  checkCommandsTakeRows(check);
}

function checkRowsPaintPixels(check: CheckReporter): void {
  check(
    'rows of palette characters paint pixels, with "." transparent by default',
    sameArt(spriteFromPaintedRows({ palette: { f: '#ff8a1f' }, rows: ['f.', '.f'] }), [
      '#ff8a1f',
      null,
      null,
      '#ff8a1f',
    ]),
  );
  check(
    'the transparent character can be repainted by naming it in the palette',
    sameArt(spriteFromPaintedRows({ palette: { '.': '#000000', f: '#ff8a1f' }, rows: ['f.', '.f'] }), [
      '#ff8a1f',
      '#000000',
      '#000000',
      '#ff8a1f',
    ]),
  );
  check(
    'a palette character can paint a hole explicitly',
    sameArt(spriteFromPaintedRows({ palette: { f: '#ff8a1f', x: null }, rows: ['fx', 'xf'] }), [
      '#ff8a1f',
      null,
      null,
      '#ff8a1f',
    ]),
  );
}

function checkMistakesAreRefusedRatherThanGuessed(check: CheckReporter): void {
  check(
    'a character missing from the palette is refused, not painted as a guess',
    spriteFromPaintedRows({ palette: { f: '#ff8a1f' }, rows: ['fq', '..'] }) === null,
  );
  check(
    'a ragged row is refused rather than padded',
    spriteFromPaintedRows({ palette: { f: '#ff8a1f' }, rows: ['ff', 'f'] }) === null,
  );
  check(
    'a grid that is not square is refused',
    spriteFromPaintedRows({ palette: { f: '#ff8a1f' }, rows: ['fff', 'fff'] }) === null,
  );
}

function checkFaceArtRows(check: CheckReporter): void {
  const art = faceArtFromPaintedRows({
    palette: { g: '#7bbf5a', h: '#808080' },
    top: ['g.', '.g'],
    height: { top: ['hh', '..'] },
    frameMs: 240,
    framesAfterFirst: [{ color: { top: ['.g', 'g.'] } }],
  });
  check(
    'painted faces take their rows and unpainted faces stay blank',
    art !== null &&
      sameArt(art.top, ['#7bbf5a', null, null, '#7bbf5a']) &&
      sameArt(art.north, blankFacePixels(2)),
  );
  check(
    'relief rows and animation frames come through with the first frame',
    art !== null &&
      sameArt(art.height?.top, ['#808080', '#808080', null, null]) &&
      art.frameMs === 240 &&
      sameArt(art.framesAfterFirst?.[0]?.color.top, [null, '#7bbf5a', '#7bbf5a', null]),
  );
  check(
    'faces of different sizes are refused rather than resized',
    faceArtFromPaintedRows({ palette: { g: '#7bbf5a' }, top: ['g.', '.g'], north: ['g..', '.g.', '..g'] }) === null,
  );
}

function checkCommandsTakeRows(check: CheckReporter): void {
  const sprite = spriteFrom({ sprite: { palette: { d: '#d9a878' }, rows: ['d.', '.d'] } });
  check(
    'the sprite command param takes rows and hands on pixels',
    sprite.ok && sameArt(sprite.value, ['#d9a878', null, null, '#d9a878']),
  );
  const art = faceArtFrom({ face_art: { palette: { g: '#7bbf5a' }, top: ['gg', 'gg'] } });
  check(
    'the face_art command param takes rows per face',
    art.ok && art.value !== null && art.value !== undefined && art.value.top[0] === '#7bbf5a',
  );
  check(
    'a document reader takes rows too, so hand-written data files can use them',
    sameArt(spriteArtFromStoredShape({ palette: { f: '#ff8a1f' }, rows: ['f.', '.f'] }), [
      '#ff8a1f',
      null,
      null,
      '#ff8a1f',
    ]),
  );
}

function sameArt(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { ASCII_COLOR_DEFAULT } from '../render/agentText/asciiColorPreference';
import {
  elevationGlyphPaint,
  HIGHEST_ELEVATION_OPACITY,
  LOWEST_ELEVATION_OPACITY,
} from '../render/agentText/elevationGlyphPaint';
import {
  ASCII_GLYPH_CELL_CLASSES,
  asciiGlyphPaint,
  WALKABLE_GLYPH_OPACITY,
} from '../render/agentText/asciiGlyphPaint';

export function checkAsciiAgentView(check: CheckReporter): void {
  check('agent text starts in colored mode', ASCII_COLOR_DEFAULT === true);
  check(
    'walkable glyphs keep the tile color at 35% opacity',
    asciiGlyphPaint('#4a7c3f', true).color === '#4a7c3f' &&
      asciiGlyphPaint('#4a7c3f', true).opacity === WALKABLE_GLYPH_OPACITY &&
      WALKABLE_GLYPH_OPACITY === 0.35,
  );
  check(
    'blocking glyphs keep the tile color at full opacity',
    asciiGlyphPaint('#2f2a28', false).color === '#2f2a28' &&
      asciiGlyphPaint('#2f2a28', false).opacity === 1,
  );
  check(
    'characters and markers stay fully opaque',
    asciiGlyphPaint('#ffffff', null).opacity === 1,
  );
  const paint = elevationGlyphPaint(['1 3', '5 9']);
  check(
    'the lowest observed elevation is the faintest',
    paint('1')?.opacity === LOWEST_ELEVATION_OPACITY,
  );
  check(
    'the highest observed elevation is the brightest',
    paint('9')?.opacity === HIGHEST_ELEVATION_OPACITY,
  );
  check(
    'elevations between the extremes ramp in opacity',
    paint('3')!.opacity > paint('1')!.opacity && paint('5')!.opacity < paint('9')!.opacity,
  );
  check('unseen elevation cells stay unpainted', paint(' ') === null);
  check(
    'letter elevations rank above digits',
    elevationGlyphPaint(['0z'])('z')?.opacity === HIGHEST_ELEVATION_OPACITY &&
      elevationGlyphPaint(['0z'])('0')?.opacity === LOWEST_ELEVATION_OPACITY,
  );
  check(
    'a single observed elevation renders at full brightness',
    elevationGlyphPaint(['4 4'])('4')?.opacity === HIGHEST_ELEVATION_OPACITY,
  );
  check(
    'each glyph cell is one em wide and one em tall',
    ASCII_GLYPH_CELL_CLASSES.includes('h-[1em]') && ASCII_GLYPH_CELL_CLASSES.includes('w-[1em]'),
  );
}

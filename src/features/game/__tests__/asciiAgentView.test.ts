import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { ASCII_COLOR_DEFAULT } from '../render/agentText/asciiColorPreference';
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
  check(
    'each glyph cell is one em wide and one em tall',
    ASCII_GLYPH_CELL_CLASSES.includes('h-[1em]') && ASCII_GLYPH_CELL_CLASSES.includes('w-[1em]'),
  );
}

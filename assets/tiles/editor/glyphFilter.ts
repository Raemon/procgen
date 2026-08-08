import { GLYPH_GROUPS, type Glyph, type GlyphGroup } from './symbolGlyphs';

export function filteredGlyphGroups(query: string): GlyphGroup[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return GLYPH_GROUPS;
  return GLYPH_GROUPS.map((group) => ({
    title: group.title,
    glyphs: group.glyphs.filter((glyph) => matchesQuery(glyph, group.title, normalized)),
  })).filter((group) => group.glyphs.length > 0);
}

export function bestMatchingGlyph(query: string): string | undefined {
  const first = filteredGlyphGroups(query)[0]?.glyphs[0];
  return first?.char ?? [...query.trim()][0];
}

function matchesQuery(glyph: Glyph, groupTitle: string, query: string): boolean {
  if (glyph.char.toLowerCase() === query) return true;
  return glyph.name.includes(query) || groupTitle.includes(query);
}

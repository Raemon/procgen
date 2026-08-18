import type { AgentObservation, LegendEntry } from '@/features/agents/observation';
import { BLANK_GLYPH, SELF_GLYPH } from '@/features/agents/observedTile';
import type { CharacterListing } from '../../multiplayer/client/charactersInPlay';
import { viewportCenteredOn } from '../ascii/asciiViewport';

export const AGENT_GLYPH = '&';
export const OTHER_PLAYER_GLYPH = '%';

export const SELF_INK = '#ffffff';
export const AGENT_INK = '#ff6ad8';
export const OTHER_PLAYER_INK = '#6ad8ff';

export function glyphOf(character: CharacterListing): string {
  if (character.isSelf) return SELF_GLYPH;
  return character.kind === 'agent' ? AGENT_GLYPH : OTHER_PLAYER_GLYPH;
}

export function inkOf(character: CharacterListing): string {
  if (character.isSelf) return SELF_INK;
  return character.kind === 'agent' ? AGENT_INK : OTHER_PLAYER_INK;
}

export function withCharactersPainted(
  obs: AgentObservation,
  characters: CharacterListing[],
): AgentObservation {
  const viewport = viewportCenteredOn(obs.position.x, obs.position.y, obs.viewSize, obs.viewSize);
  const rows = obs.view.map((line) => [...line]);
  const painted: CharacterListing[] = [];
  for (const character of characters) {
    const column = character.x - viewport.originX;
    const line = rows[character.y - viewport.originY];
    if (!line || column < 0 || column >= line.length) continue;
    if (line[column] === BLANK_GLYPH && !character.isSelf) continue;
    line[column] = glyphOf(character);
    painted.push(character);
  }
  return {
    ...obs,
    view: rows.map((row) => row.join('')),
    legend: legendWithCharacters(obs.legend, painted),
  };
}

export function characterInkLookup(characters: CharacterListing[]): Map<string, string> {
  const inks = new Map<string, string>();
  for (const character of characters) inks.set(`${character.x},${character.y}`, inkOf(character));
  return inks;
}

function legendWithCharacters(
  legend: LegendEntry[],
  painted: CharacterListing[],
): LegendEntry[] {
  const entries = legend.filter((entry) => entry.glyph !== SELF_GLYPH);
  const self = painted.find((character) => character.isSelf);
  if (self) entries.unshift({ glyph: SELF_GLYPH, meaning: `you (${self.x},${self.y})`, walkable: null });
  for (const glyph of [AGENT_GLYPH, OTHER_PLAYER_GLYPH]) {
    const named = painted.filter((character) => glyphOf(character) === glyph);
    if (named.length === 0) continue;
    entries.unshift({
      glyph,
      meaning: named.map((character) => `${character.name} (${character.x},${character.y})`).join(', '),
      walkable: null,
    });
  }
  return entries;
}

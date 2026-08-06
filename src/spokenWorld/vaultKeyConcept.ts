import { LANGUAGE_CONCEPTS, type LanguageConcept } from '../language/concepts';
import { conceptForTile, type ConceptTile } from '../language/tileConcepts';
import { VAULT_WALL_RADIUS } from './vaultLayout';

export const VAULT_SURVEY_RADIUS = 7;
const MUNDANE_CONCEPTS: readonly LanguageConcept[] = ['grass', 'land'];
const DISTINCTIVE_MIN_COUNT = 6;

type TileAt = (x: number, y: number) => number;
type TileLookup = (tileId: number) => ConceptTile | undefined;

export function vaultKeyConcept(tileAt: TileAt, tileById: TileLookup, vaultX: number, vaultY: number): LanguageConcept {
  const tallies = surveyConcepts(tileAt, tileById, vaultX, vaultY);
  return distinctiveConcept(tallies) ?? commonestConcept(tallies) ?? 'land';
}

function surveyConcepts(tileAt: TileAt, tileById: TileLookup, vaultX: number, vaultY: number): Map<LanguageConcept, number> {
  const tallies = new Map<LanguageConcept, number>();
  for (let dy = -VAULT_SURVEY_RADIUS; dy <= VAULT_SURVEY_RADIUS; dy++) {
    for (let dx = -VAULT_SURVEY_RADIUS; dx <= VAULT_SURVEY_RADIUS; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) <= VAULT_WALL_RADIUS) continue;
      const concept = conceptForTile(tileById(tileAt(vaultX + dx, vaultY + dy)));
      if (concept) tallies.set(concept, (tallies.get(concept) ?? 0) + 1);
    }
  }
  return tallies;
}

function distinctiveConcept(tallies: Map<LanguageConcept, number>): LanguageConcept | null {
  return bestConcept(tallies, (concept) => !MUNDANE_CONCEPTS.includes(concept), DISTINCTIVE_MIN_COUNT);
}

function commonestConcept(tallies: Map<LanguageConcept, number>): LanguageConcept | null {
  return bestConcept(tallies, () => true, 1);
}

function bestConcept(
  tallies: Map<LanguageConcept, number>,
  allowed: (concept: LanguageConcept) => boolean,
  minCount: number,
): LanguageConcept | null {
  let best: LanguageConcept | null = null;
  let bestCount = minCount - 1;
  for (const concept of LANGUAGE_CONCEPTS) {
    const count = tallies.get(concept) ?? 0;
    if (allowed(concept) && count > bestCount) {
      best = concept;
      bestCount = count;
    }
  }
  return best;
}

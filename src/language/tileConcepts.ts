import type { LanguageConcept } from './concepts';

export interface ConceptTile {
  name: string;
  role: string | null;
}

const CONCEPTS_BY_ROLE: Record<string, LanguageConcept> = {
  water: 'water',
  sand: 'sand',
  grass: 'grass',
  tree: 'tree',
  rock: 'stone',
};

const CONCEPTS_BY_NAME: Record<string, LanguageConcept> = {
  'deep water': 'sea',
  ice: 'ice',
  snow: 'snow',
  marsh: 'marsh',
  lava: 'fire',
};

export function conceptForTile(tile: ConceptTile | undefined): LanguageConcept | null {
  if (!tile) return null;
  return CONCEPTS_BY_NAME[tile.name] ?? (tile.role ? (CONCEPTS_BY_ROLE[tile.role] ?? null) : null);
}

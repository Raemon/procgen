import type { CandidateOrigin } from '../selfPlay/candidateRecord';

export const CANDIDATE_ORIGINS: CandidateOrigin[] = ['rolled', 'mutated', 'bred', 'treated'];

const ORIGIN_INK: Record<CandidateOrigin, string> = {
  rolled: '#6aa9ff',
  mutated: '#ffd86a',
  bred: '#8ae08a',
  treated: '#ff9d6a',
};

export function originInk(origin: CandidateOrigin): string {
  return ORIGIN_INK[origin];
}

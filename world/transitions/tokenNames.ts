import { VITALITY_TOKEN } from './transitionRule';

export function tokenName(tokenType: number): string {
  return tokenType === VITALITY_TOKEN ? 'vitality' : `token ${tokenType}`;
}

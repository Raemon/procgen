import { MATERIAL_SYNTHS } from '../textures/materialCatalog';
import type { Weighted } from './kitRandom';

export type MaterialRole = 'wall' | 'roof' | 'trim' | 'floor' | 'ground';

const ROLE_AFFINITY: Record<MaterialRole, Record<string, number>> = {
  wall: { dressedGranite: 5, fieldstone: 5, limewashWattle: 5, rammedEarth: 3, cobbles: 1, rivetedIron: 1 },
  roof: { thatch: 6, slateShingle: 6, oakPlank: 2, flagstone: 2, fieldstone: 1 },
  trim: { oakBeam: 6, oakPlank: 4, rivetedIron: 2, dressedGranite: 1 },
  floor: { oakPlank: 5, flagstone: 4, rammedEarth: 4, dressedGranite: 2, cobbles: 2 },
  ground: { cobbles: 5, troddenEarth: 5, gravel: 4, flagstone: 3, scree: 1 },
};

export function materialChoicesFor(role: MaterialRole): Weighted<string>[] {
  return Object.entries(ROLE_AFFINITY[role])
    .filter(([id]) => MATERIAL_SYNTHS.some((material) => material.id === id))
    .map(([value, weight]) => ({ value, weight }));
}

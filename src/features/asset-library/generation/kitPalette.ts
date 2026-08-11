import type { RandomStream } from '@/features/asset-library/worlds/random/mulberry32';
import { kitStream, pickOne, pickWeighted } from './kitRandom';
import { materialChoicesFor, type MaterialRole } from './materialRoleAffinity';

export interface KitPalette {
  materials: Record<MaterialRole, string>;
  hueBias: number;
}

const PALETTE_ROLES: MaterialRole[] = ['wall', 'roof', 'trim', 'floor', 'ground'];

const EARTHY_HUE_BANDS: readonly { from: number; to: number }[] = [
  { from: 0.02, to: 0.12 },
  { from: 0.1, to: 0.17 },
  { from: 0.2, to: 0.3 },
  { from: 0.5, to: 0.62 },
];

export function generateKitPalette(seed: number): KitPalette {
  const random = kitStream(seed, 'palette');
  return { materials: chosenMaterials(seed), hueBias: earthyHueBias(random) };
}

function earthyHueBias(random: RandomStream): number {
  const band = pickOne(random, EARTHY_HUE_BANDS);
  return band.from + random() * (band.to - band.from);
}

function chosenMaterials(seed: number): Record<MaterialRole, string> {
  const chosen = {} as Record<MaterialRole, string>;
  for (const role of PALETTE_ROLES) chosen[role] = chosenMaterialFor(seed, role);
  return chosen;
}

function chosenMaterialFor(seed: number, role: MaterialRole): string {
  return pickWeighted(kitStream(seed, `material:${role}`), materialChoicesFor(role));
}

import type { CharacterRotation } from '@/features/asset-library/characters/characterBillboard';

export type GauntFace = 'both' | 'near' | 'none';

export interface GauntOneView {
  breadth: number;
  forward: number;
  face: GauntFace;
  spineRidge: boolean;
}

const VIEWS: Readonly<Record<CharacterRotation, GauntOneView>> = {
  front: { breadth: 1, forward: 0, face: 'both', spineRidge: false },
  frontQuarter: { breadth: 0.75, forward: 0.55, face: 'both', spineRidge: false },
  side: { breadth: 0.4, forward: 1, face: 'near', spineRidge: false },
  backQuarter: { breadth: 0.75, forward: 0.55, face: 'none', spineRidge: true },
  back: { breadth: 1, forward: 0, face: 'none', spineRidge: true },
};

export function gauntOneView(rotation: CharacterRotation): GauntOneView {
  return VIEWS[rotation];
}

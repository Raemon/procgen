import type { CubeFaceArt } from '../world/tiles/tileFaceArt';
import { WANDER } from './behaviorKinds';

export interface CreatureDef {
  id: number;
  name: string;
  symbol: string;
  color: string;
  faceArt: CubeFaceArt | null;
  behavior: number;
  speed: number;
  sight: number;
  roam: number;
  size: number;
  phasing: 0 | 1;
}

export function newCreatureWithId(id: number): CreatureDef {
  return {
    id,
    name: `creature ${id}`,
    symbol: 'c',
    color: '#e0a05a',
    faceArt: null,
    behavior: WANDER,
    speed: 1.5,
    sight: 8,
    roam: 6,
    size: 0.7,
    phasing: 0,
  };
}

import { hashString } from '../../random/hashString';

export type VillageHashSeed = (label: string) => number;

export function villageHashSeedAt(centerX: number, centerY: number): VillageHashSeed {
  return (label) => hashString(`village:${label}:${centerX},${centerY}`);
}

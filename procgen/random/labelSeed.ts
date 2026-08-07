import { hashString } from './hashString';

export function labelSeed(seed: number, nodeId: string, label: string): number {
  return hashString(`${seed}:${nodeId}:${label}`);
}

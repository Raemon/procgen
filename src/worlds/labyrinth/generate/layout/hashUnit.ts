import { hashString } from '@/features/asset-library/worlds/random/hashString';
import { mulberry32 } from '@/features/asset-library/worlds/random/mulberry32';

export function hashUnit(label: string): number {
  return mulberry32(hashString(label))();
}

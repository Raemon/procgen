import { hashString } from '../random/hashString';
import { mulberry32 } from '../random/mulberry32';

export function hashUnit(label: string): number {
  return mulberry32(hashString(label))();
}

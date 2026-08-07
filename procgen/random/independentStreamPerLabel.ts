import { hashString } from './hashString';
import { mulberry32, type RandomStream } from './mulberry32';

export function independentStreamPerLabel(seed: number, label: string): RandomStream {
  return mulberry32(hashString(`${seed}:${label}`));
}

import type { Culture } from '@/features/asset-library/cultures/cultureDef';

export interface CultureSource {
  byId(id: number): Culture | undefined;
}

export const NO_CULTURES: CultureSource = {
  byId: () => undefined,
};

import type { Culture } from '../../assets/cultures/cultureDef';

export interface CultureSource {
  byId(id: number): Culture | undefined;
}

export const NO_CULTURES: CultureSource = {
  byId: () => undefined,
};

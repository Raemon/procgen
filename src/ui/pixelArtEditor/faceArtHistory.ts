import { isEntirelyBlank, type CubeFaceArt } from '../../world/tiles/tileFaceArt';
import type { PixelArtSource } from './pixelArtEditor';

const HISTORY_LIMIT = 100;

export interface FaceArtHistory {
  commit(art: CubeFaceArt): void;
  undo(): boolean;
}

export function faceArtHistory(source: PixelArtSource): FaceArtHistory {
  const past: (CubeFaceArt | null)[] = [];
  return {
    commit(art) {
      past.push(source.art());
      if (past.length > HISTORY_LIMIT) past.shift();
      source.onChange(isEntirelyBlank(art) ? null : art);
    },
    undo() {
      if (past.length === 0) return false;
      source.onChange(past.pop() ?? null);
      return true;
    },
  };
}

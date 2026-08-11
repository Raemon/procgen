import { useRef } from 'react';
import { isEntirelyBlank, type CubeFaceArt } from '../tiles/tileFaceArt';

const HISTORY_LIMIT = 100;

export interface FaceArtHistory {
  commit(next: CubeFaceArt): void;
  undo(): void;
}

export function useFaceArtHistory(
  art: CubeFaceArt | null,
  onChange: (art: CubeFaceArt | null) => void,
): FaceArtHistory {
  const past = useRef<(CubeFaceArt | null)[]>([]);
  return {
    commit(next) {
      past.current.push(art);
      if (past.current.length > HISTORY_LIMIT) past.current.shift();
      onChange(isEntirelyBlank(next) ? null : next);
    },
    undo() {
      if (past.current.length > 0) onChange(past.current.pop() ?? null);
    },
  };
}

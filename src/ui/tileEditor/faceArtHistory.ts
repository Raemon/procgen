import type { TileDef } from '../../world/tiles/tileDef';
import { isEntirelyBlank, type CubeFaceArt } from '../../world/tiles/tileFaceArt';
import type { EditableTileFields } from '../../world/tiles/tileset';

const HISTORY_LIMIT = 100;

export interface FaceArtHistory {
  commit(art: CubeFaceArt): void;
  undo(): boolean;
}

export function faceArtHistory(
  tile: TileDef,
  onEdit: (patch: EditableTileFields) => void,
): FaceArtHistory {
  const past: (CubeFaceArt | null)[] = [];
  return {
    commit(art) {
      past.push(tile.faceArt);
      if (past.length > HISTORY_LIMIT) past.shift();
      onEdit({ faceArt: isEntirelyBlank(art) ? null : art });
    },
    undo() {
      if (past.length === 0) return false;
      onEdit({ faceArt: past.pop() ?? null });
      return true;
    },
  };
}

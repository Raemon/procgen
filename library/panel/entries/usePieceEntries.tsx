import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnPieceChange } from '../../../frontend/rerenderHooks';
import { PieceIcon } from '../icons/PieceIcon';
import type { LibraryEntry } from './libraryEntry';

export function usePieceEntries(): LibraryEntry[] {
  const { pieces, perform } = useAppRuntime();
  useRerenderOnPieceChange();
  return pieces.all().map((piece) => ({
    key: String(piece.id),
    name: piece.name,
    icon: <PieceIcon piece={piece} />,
    tip: {
      title: piece.name,
      body: `piece ${piece.id} · role ${piece.role} · ${piece.width}×${piece.depth}, ${piece.layers} layers`,
    },
    duplicate: () => perform('duplicate_piece', { piece_id: piece.id }),
    remove: () => perform('remove_piece', { piece_id: piece.id }),
  }));
}

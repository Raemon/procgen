import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { PanelHint } from '@/features/app-shell/help/PanelHint';
import { useRerenderOnPieceChange } from '@/features/app-shell/runtime/rerenderHooks';
import { PieceSheet } from '@/features/asset-library/pieces/editor/PieceSheet';
import { NothingHere } from './NothingHere';

export function PieceDetail({ id }: { id: number }) {
  const { pieces } = useAppRuntime();
  useRerenderOnPieceChange();
  const piece = pieces.all().find((each) => each.id === id);
  if (!piece) return <NothingHere what="piece" />;
  return (
    <>
      <PieceSheet key={piece.id} piece={piece} />
      <PanelHint className="mt-2">
        Pieces are voxel stamps: layer 1 is the ground cell, higher layers stack upward. Bind them
        to any points node with display “pieces” to scatter them through the world, or press
        capture in the world view and drag a rectangle to lift a section of the world into a new
        piece.
      </PanelHint>
    </>
  );
}

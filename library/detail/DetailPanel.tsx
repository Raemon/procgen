import type { LibrarySelection } from '../librarySelection';
import { useLibrarySelection } from '../useLibrarySelection';
import { CreatureDetail } from './CreatureDetail';
import { CultureDetail } from './CultureDetail';
import { ItemDetail } from './ItemDetail';
import { NodeDetail } from './NodeDetail';
import { NodeGroupDetail } from './NodeGroupDetail';
import { PieceDetail } from './PieceDetail';
import { TileDetail } from './TileDetail';
import { WorldDetail } from './WorldDetail';

export function DetailPanel() {
  const [selection] = useLibrarySelection();
  return detailFor(selection);
}

function detailFor(selection: LibrarySelection) {
  const id = Number(selection.key);
  switch (selection.folder) {
    case 'world':
      return <WorldDetail />;
    case 'tiles':
      return <TileDetail id={id} />;
    case 'items':
      return <ItemDetail id={id} />;
    case 'pieces':
      return <PieceDetail id={id} />;
    case 'cultures':
      return <CultureDetail id={id} />;
    case 'creatures':
      return <CreatureDetail id={id} character={false} />;
    case 'characters':
      return <CreatureDetail id={id} character />;
    case 'groups':
      return <NodeGroupDetail name={selection.key} />;
    case 'pipeline':
      return <NodeDetail nodeId={selection.key} />;
  }
}

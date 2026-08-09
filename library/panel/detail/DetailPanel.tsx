import type { LibrarySelection } from '../../librarySelection';
import { useLibrarySelection } from '../useLibrarySelection';
import { storedWorldOf } from '../../worldKeys';
import { CreatureDetail } from './CreatureDetail';
import { CultureDetail } from './CultureDetail';
import { CurrentWorldDetail } from './CurrentWorldDetail';
import { ItemDetail } from './ItemDetail';
import { NodeGroupDetail } from './NodeGroupDetail';
import { PieceDetail } from './PieceDetail';
import { StoredWorldDetail } from './StoredWorldDetail';
import { TileDetail } from './TileDetail';

export function DetailPanel() {
  const [selection] = useLibrarySelection();
  return detailFor(selection);
}

function detailFor(selection: LibrarySelection) {
  const id = Number(selection.key);
  switch (selection.folder) {
    case 'worlds':
      return worldDetail(selection.key);
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
  }
}

function worldDetail(key: string) {
  const stored = storedWorldOf(key);
  return stored ? <StoredWorldDetail world={stored} /> : <CurrentWorldDetail />;
}

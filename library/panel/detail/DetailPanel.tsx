import type { AssetKind } from '../../../assets/asset';
import type { LibrarySelection } from '../../librarySelection';
import { useLibrarySelection } from '../useLibrarySelection';
import { storedWorldOf } from '../../worldKeys';
import { CreatureDetail } from './CreatureDetail';
import { CultureDetail } from './CultureDetail';
import { CurrentWorldDetail } from './CurrentWorldDetail';
import { ItemDetail } from './ItemDetail';
import { NodeGroupDetail } from './NodeGroupDetail';
import { NothingHere } from './NothingHere';
import { PieceDetail } from './PieceDetail';
import { StoredWorldDetail } from './StoredWorldDetail';
import { TileDetail } from './TileDetail';

export function DetailPanel() {
  const [selection] = useLibrarySelection();
  return detailFor(selection);
}

function detailFor(selection: LibrarySelection) {
  if (selection.folder === 'worlds') return worldDetail(selection.key);
  if (selection.folder === 'groups') return <NodeGroupDetail name={selection.key} />;
  const id = assetIdOf(selection.key);
  if (id === null) return <NothingHere what={selection.folder} />;
  return assetDetail(selection.folder, id);
}

function worldDetail(key: string) {
  const stored = storedWorldOf(key);
  return stored ? <StoredWorldDetail world={stored} /> : <CurrentWorldDetail />;
}

function assetDetail(folder: AssetKind, id: number) {
  switch (folder) {
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
  }
}

function assetIdOf(key: string): number | null {
  const id = Number(key);
  return key.trim() === '' || !Number.isFinite(id) ? null : id;
}

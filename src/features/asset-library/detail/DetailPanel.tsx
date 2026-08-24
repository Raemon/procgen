import type { AssetId, AssetKind } from '@/features/asset-library/asset';
import type { LibrarySelection } from '../librarySelection';
import { useLibrarySelection } from '../panel/useLibrarySelection';
import { CreatureDetail } from './CreatureDetail';
import { CultureDetail } from './CultureDetail';
import { ItemDetail } from './ItemDetail';
import { NodeGroupDetail } from './NodeGroupDetail';
import { NothingHere } from './NothingHere';
import { NothingSelected } from './NothingSelected';
import { PieceDetail } from './PieceDetail';
import { TileDetail } from './TileDetail';
import { SavedWorldDetail } from './SavedWorldDetail';
import { WorldSeedDetail } from './WorldSeedDetail';

export function DetailPanel() {
  const { selection } = useLibrarySelection();
  return selection ? detailFor(selection) : <NothingSelected />;
}

function detailFor(selection: LibrarySelection) {
  if (selection.folder === 'worldSeeds') return <WorldSeedDetail name={selection.key} />;
  if (selection.folder === 'savedWorlds') return <SavedWorldDetail name={selection.key} />;
  if (selection.folder === 'groups') return <NodeGroupDetail name={selection.key} />;
  const id = assetIdOf(selection.key);
  if (id === null) return <NothingHere what={selection.folder} />;
  return assetDetail(selection.folder, id);
}

function assetDetail(folder: AssetKind, id: AssetId) {
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

function assetIdOf(key: string): AssetId | null {
  const id = Number(key);
  return key.trim() === '' || !Number.isFinite(id) ? null : (id as AssetId);
}

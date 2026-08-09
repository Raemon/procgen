import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { PanelHint } from '../../frontend/help/PanelHint';
import { useRerenderOnTileAssetChange } from '../../frontend/rerenderHooks';
import { TileRow } from '../../assets/tiles/editor/TileRow';
import { NothingHere } from './NothingHere';

export function TileDetail({ id }: { id: number }) {
  const { tileAssets } = useAppRuntime();
  useRerenderOnTileAssetChange();
  const tile = tileAssets.all().find((each) => each.id === id);
  if (!tile) return <NothingHere what="tile" />;
  return (
    <>
      <TileRow tile={tile} />
      <PanelHint className="mt-2">
        Procgen nodes pick from the tiles folder: tile params and marker displays reference tiles
        by id, so symbol, art and walkability edits apply everywhere this tile is used. Colour comes
        from the art — paint the cube faces and the flat views follow.
      </PanelHint>
    </>
  );
}

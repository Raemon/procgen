import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnTileAssetChange } from '../../../frontend/rerenderHooks';
import { Button } from '../../../frontend/controls/Button';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { ADD_TILE_TIP } from './help/tileTips';
import { TileRow } from './TileRow';

export function TilesTab() {
  const { tileAssets, perform } = useAppRuntime();
  useRerenderOnTileAssetChange();
  return (
    <>
      {tileAssets.all().map((tile) => (
        <TileRow key={tile.id} tile={tile} />
      ))}
      <Button className="mt-2" tip={ADD_TILE_TIP} onClick={() => perform('add_tile')}>
        + add tile
      </Button>
      <PanelHint className="mt-2">
        Procgen nodes pick from this list: tile params and marker displays reference tiles here, so
        symbol, art and walkability edits apply everywhere a tile is used. Colour comes from the
        art — paint the cube faces and the flat views follow.
      </PanelHint>
    </>
  );
}

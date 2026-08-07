import { useAppRuntime } from '../../app/appRuntimeContext';
import { useRerenderOnTilesetChange } from '../../app/rerenderHooks';
import { Button } from '../controls/Button';
import { PanelHint } from '../help/PanelHint';
import { TileRow } from './TileRow';

export function TilesTab() {
  const { tileset, perform } = useAppRuntime();
  useRerenderOnTilesetChange();
  return (
    <>
      {tileset.all().map((tile) => (
        <TileRow key={tile.id} tile={tile} />
      ))}
      <Button className="mt-2" onClick={() => perform('add_tile')}>
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

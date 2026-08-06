import { useAppRuntime } from '../../app/appRuntimeContext';
import { useRerenderOnTilesetChange } from '../../app/rerenderHooks';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { HINT_CLASSES, PANEL_HEADING_CLASSES } from '../controls/fieldClasses';
import { TileRow } from './TileRow';

export function TileEditorPanel() {
  const { tileset } = useAppRuntime();
  useRerenderOnTilesetChange();
  return (
    <>
      <h2 className={PANEL_HEADING_CLASSES}>tiles</h2>
      {tileset.all().map((tile) => (
        <TileRow key={tile.id} tile={tile} />
      ))}
      <Button className="mt-2" onClick={() => tileset.add()}>
        + add tile
      </Button>
      <p className={classes(HINT_CLASSES, 'mt-2')}>
        Procgen nodes pick from this list: tile params and marker displays reference tiles here, so
        symbol, color, art and walkability edits apply everywhere a tile is used.
      </p>
    </>
  );
}

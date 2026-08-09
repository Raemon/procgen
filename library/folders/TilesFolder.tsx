import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { useRerenderOnTileAssetChange } from '../../frontend/rerenderHooks';
import { Button } from '../../frontend/controls/Button';
import { ADD_TILE_TIP } from '../../assets/tiles/editor/help/tileTips';
import { FOLDER_TIPS } from '../help/libraryTips';
import { LibraryFolder } from '../panel/LibraryFolder';
import { LibraryRow } from '../panel/LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

export function TilesFolder() {
  const { tileAssets, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
  useRerenderOnTileAssetChange();
  const tiles = tileAssets.all();

  function addTileAndSelectIt(): void {
    perform('add_tile');
    const added = tileAssets.all().at(-1);
    if (added) select('tiles', String(added.id));
  }

  return (
    <LibraryFolder folder="tiles" tip={FOLDER_TIPS.tiles} count={tiles.length}>
      {tiles.map((tile) => (
        <LibraryRow
          key={tile.id}
          folder="tiles"
          entryKey={String(tile.id)}
          name={tile.name}
          glyph={tile.symbol}
          tint={tile.color}
          note={tile.walkable ? undefined : 'blocks'}
          tip={{
            title: tile.name,
            body: `tile ${tile.id} · symbol “${tile.symbol}” · ${tile.walkable ? 'walkable' : 'blocking'}`,
          }}
        />
      ))}
      <Button className="mt-1 w-full" tip={ADD_TILE_TIP} onClick={addTileAndSelectIt}>
        + add tile
      </Button>
    </LibraryFolder>
  );
}

import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { ADD_TILE_TIP } from '@/features/asset-library/tiles/editor/help/tileTips';
import { useTileEntries } from '../entries/useTileEntries';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

export function TilesFolder() {
  const { tileAssets, perform } = useAppRuntime();
  const { select } = useLibrarySelection();
  const entries = useTileEntries();

  function addTileAndSelectIt(): void {
    perform('add_tile');
    const added = tileAssets.all().at(-1);
    if (added) select('tiles', String(added.id));
  }

  return (
    <LibraryFolder folder="tiles" tip={FOLDER_TIPS.tiles} count={entries.length}>
      {entries.map((entry) => (
        <LibraryRow key={entry.key} folder="tiles" entry={entry} />
      ))}
      <Button className="mt-1 w-full" tip={ADD_TILE_TIP} onClick={addTileAndSelectIt}>
        + add tile
      </Button>
    </LibraryFolder>
  );
}

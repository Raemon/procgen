import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { ADD_CULTURE_TIP } from '@/features/asset-library/cultures/editor/help/cultureTips';
import { useCultureEntries } from '../entries/useCultureEntries';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { useLibrarySelection } from '../useLibrarySelection';
import { AssetFolderSection } from './AssetFolderSection';

export function CulturesFolder() {
  const { cultures, perform } = useAppRuntime();
  const { select } = useLibrarySelection();
  const entries = useCultureEntries();

  function addCultureAndSelectIt(): void {
    perform('add_culture');
    const added = cultures.all().at(-1);
    if (added) select('cultures', String(added.id));
  }

  return (
    <LibraryFolder folder="cultures" tip={FOLDER_TIPS.cultures} count={entries.length}>
      <AssetFolderSection section="cultures" entries={entries}>
        <Button className="mt-1 w-full" tip={ADD_CULTURE_TIP} onClick={addCultureAndSelectIt}>
          + add culture
        </Button>
      </AssetFolderSection>
    </LibraryFolder>
  );
}

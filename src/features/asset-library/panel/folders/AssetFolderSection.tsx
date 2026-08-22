import type { ReactNode } from 'react';
import { Button } from '@/features/app-shell/controls/Button';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { LibraryFolder } from '../../librarySelection';
import { ADD_ASSET_FOLDER_TIP } from '../../help/folderTips';
import type { LibraryEntry } from '../entries/libraryEntry';
import { AssetFolderTree } from './AssetFolderTree';

export function AssetFolderSection({
  section,
  entries,
  children,
}: {
  section: LibraryFolder;
  entries: readonly LibraryEntry[];
  children?: ReactNode;
}) {
  const { perform } = useAppRuntime();
  return (
    <>
      <AssetFolderTree section={section} entries={entries} parentId={null} />
      {children}
      <Button
        className="mt-1 w-full"
        tip={ADD_ASSET_FOLDER_TIP}
        onClick={() => perform('add_asset_folder', { section, name: 'new folder' })}
      >
        + folder
      </Button>
    </>
  );
}

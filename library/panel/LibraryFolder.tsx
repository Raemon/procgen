import type { ReactNode } from 'react';
import { PERSISTED_UI_KEYS } from '../../frontend/uiState/persistedUiKeys';
import { usePersistedUiSet } from '../../frontend/uiState/usePersistedUiSet';
import type { TooltipContent } from '../../frontend/tooltips/tooltipContent';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import { openFolderTip } from '../help/libraryTips';
import type { LibraryFolder as FolderName } from '../librarySelection';

const OPEN_UNTIL_A_FOLDER_IS_TOGGLED: FolderName[] = ['pipeline'];

export function LibraryFolder({
  folder,
  tip,
  count,
  children,
}: {
  folder: FolderName;
  tip: TooltipContent;
  count: number;
  children: ReactNode;
}) {
  const openFolders = usePersistedUiSet(
    PERSISTED_UI_KEYS.openLibraryFolders,
    OPEN_UNTIL_A_FOLDER_IS_TOGGLED,
  );
  const open = openFolders.has(folder);
  return (
    <section className="mb-1">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-1.5 rounded border border-transparent px-1 py-1 text-left hover:border-panel-edge hover:bg-field"
        onClick={() => openFolders.toggle(folder)}
        {...tooltipHandlers(open ? openFolderTip(folder, tip) : tip)}
      >
        <span className="w-2 text-[10px] text-ink-dim">{open ? '▾' : '▸'}</span>
        <span className="flex-1 text-xs tracking-[0.08em] text-ink uppercase">{folder}</span>
        <span className="text-[10px] text-ink-dim">{count}</span>
      </button>
      {open && <div className="mb-1.5 ml-2 border-l border-panel-edge pl-1.5">{children}</div>}
    </section>
  );
}

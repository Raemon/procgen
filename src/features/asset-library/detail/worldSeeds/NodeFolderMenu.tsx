import { useState } from 'react';
import { useEditedPipeline } from './editing/editedPipelineContext';
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { classes } from '@/features/app-shell/controls/classes';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { useEscapeToDismiss } from '@/features/app-shell/controls/useEscapeToDismiss';
import { FolderIcon } from '@/features/app-shell/icons/rowActionIcons';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { nodeFolderTip } from './help/nodeCardTips';
import { folderNamesIn } from './nodeFolderRuns';

export function NodeFolderMenu({ node }: { node: NodeInstance }) {
  const { store, perform } = useEditedPipeline();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  useEscapeToDismiss(close);

  function assign(folder: string): void {
    perform('set_folder', { node_id: node.id, folder });
    close();
  }

  return (
    <div className="relative flex shrink-0 items-center" onBlur={onBlurOutside(close)}>
      <button
        type="button"
        className={classes(
          'flex cursor-pointer items-center gap-[3px] rounded border border-transparent px-1 py-[3px] hover:border-panel-edge',
          node.folder ? 'text-accent' : 'text-ink-dim hover:text-ink',
        )}
        aria-label={node.folder ? `folder: ${node.folder}` : 'folder: ungrouped'}
        onClick={() => setOpen(!open)}
        {...tooltipHandlers(nodeFolderTip(node))}
      >
        <FolderIcon size={14} />
        <span className="text-[9px] leading-none">▾</span>
      </button>
      {open && (
        <FolderChoices
          current={node.folder}
          folders={folderNamesIn(store.nodes())}
          onPick={assign}
        />
      )}
    </div>
  );
}

function FolderChoices({
  current,
  folders,
  onPick,
}: {
  current: string;
  folders: string[];
  onPick(folder: string): void;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div className="absolute top-full right-0 z-20 mt-1 w-48 rounded-md border border-panel-edge bg-field p-1.5 shadow-lg">
      <input
        autoFocus
        type="text"
        placeholder="new folder name…"
        aria-label="new folder name"
        className={classes(FIELD_CLASSES, 'mb-1.5 w-full')}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && draft.trim() && onPick(draft.trim())}
      />
      <FolderChoice label="ungrouped" picked={current === ''} onPick={() => onPick('')} />
      {folders.map((folder) => (
        <FolderChoice key={folder} label={folder} picked={current === folder} onPick={() => onPick(folder)} />
      ))}
    </div>
  );
}

function FolderChoice({
  label,
  picked,
  onPick,
}: {
  label: string;
  picked: boolean;
  onPick(): void;
}) {
  return (
    <button
      type="button"
      className={classes(
        'block w-full cursor-pointer truncate rounded border-none bg-transparent px-2 py-[5px] text-left text-xs hover:bg-procgen',
        picked ? 'text-accent' : 'text-ink',
      )}
      onClick={onPick}
    >
      {label}
    </button>
  );
}

function onBlurOutside(close: () => void) {
  return (event: { currentTarget: HTMLElement; relatedTarget: EventTarget | null }) => {
    const moved = event.relatedTarget;
    if (!(moved instanceof Node) || !event.currentTarget.contains(moved)) close();
  };
}

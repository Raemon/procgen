import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { useEditedPipeline } from './editing/editedPipelineContext';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { classes } from '@/features/app-shell/controls/classes';
import { FOLDER_HOVER_GROUP, REVEALED_ON_FOLDER_HOVER } from '@/features/app-shell/controls/revealOnRowHover';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { openGroupTip, SEND_BAND_TO_LIBRARY_TIP } from '../../help/libraryTips';
import { useLibrarySelection } from '../../panel/useLibrarySelection';
import { collapseFolderTip, FOLDER_NAME_TIP, UNGROUP_TIP } from './help/nodeCardTips';
import type { NodeRun } from './nodeFolderRuns';

export function NodeFolderBand({
  run,
  collapsed,
  onToggleCollapsed,
  children,
}: {
  run: NodeRun;
  collapsed: boolean;
  onToggleCollapsed(): void;
  children: ReactNode;
}) {
  return (
    <section
      className={classes(
        FOLDER_HOVER_GROUP,
        'rounded-md border border-dashed border-panel-edge bg-bg/40 p-1.5',
      )}
    >
      <FolderHeader run={run} collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
      {collapsed ? <CollapsedSummary run={run} /> : <div className="flex flex-col gap-2.5">{children}</div>}
    </section>
  );
}

function FolderHeader({
  run,
  collapsed,
  onToggleCollapsed,
}: {
  run: NodeRun;
  collapsed: boolean;
  onToggleCollapsed(): void;
}) {
  const { perform } = useEditedPipeline();
  const nodeIds = run.nodes.map((node) => node.id);
  return (
    <div className="mb-1.5 flex items-center gap-[5px] px-0.5">
      <button
        type="button"
        className="cursor-pointer border-none bg-transparent p-0.5 text-[11px] text-ink-dim hover:text-ink"
        aria-label="collapse or expand folder"
        onClick={onToggleCollapsed}
        {...tooltipHandlers(collapseFolderTip(collapsed))}
      >
        {collapsed ? '▸' : '▾'}
      </button>
      <FolderNameInput folder={run.folder} nodeIds={nodeIds} />
      <span className="text-[10px] whitespace-nowrap text-ink-dim">
        {run.nodes.length} node{run.nodes.length === 1 ? '' : 's'}
      </span>
      <OpenGroupButton folder={run.folder} />
      <SendToLibraryButton run={run} />
      <Button
        className={classes(REVEALED_ON_FOLDER_HOVER, 'px-1.5 py-0.5 text-[11px]')}
        tip={UNGROUP_TIP}
        onClick={() => setFolderOfNodes(perform, nodeIds, '')}
      >
        ⊘
      </Button>
    </div>
  );
}

function OpenGroupButton({ folder }: { folder: string }) {
  const { templates } = useAppRuntime();
  const { select } = useLibrarySelection();
  useSyncExternalStore(
    (listener) => templates.onChange(listener),
    () => templates.savedTemplates(),
  );
  if (!templates.byName(folder)) return null;
  return (
    <Button
      className="px-1.5 py-0.5 text-[11px]"
      tip={openGroupTip(folder)}
      onClick={() => select('groups', folder)}
    >
      ↗
    </Button>
  );
}

function SendToLibraryButton({ run }: { run: NodeRun }) {
  const { perform } = useEditedPipeline();
  const { select } = useLibrarySelection();
  function sendToLibrary(): void {
    const saved = perform('save_template', {
      name: run.folder,
      node_ids: run.nodes.map((node) => node.id),
      description: describeRun(run),
    });
    if (!saved.ok) return window.alert(saved.hint);
    select('groups', run.folder);
  }
  return (
    <Button className="px-1.5 py-0.5 text-[11px]" tip={SEND_BAND_TO_LIBRARY_TIP} onClick={sendToLibrary}>
      ⤓ library
    </Button>
  );
}

function describeRun(run: NodeRun): string {
  return `Sent to the library from a world: ${run.nodes.map((node) => node.label).join(' → ')}.`;
}

function FolderNameInput({ folder, nodeIds }: { folder: string; nodeIds: string[] }) {
  const { perform } = useEditedPipeline();
  const [draft, setDraft] = useState(folder);
  const commit = () => draft.trim() && setFolderOfNodes(perform, nodeIds, draft.trim());
  return (
    <input
      type="text"
      className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-[3px] text-xs font-semibold tracking-wide text-ink-dim uppercase hover:border-panel-edge hover:bg-bg focus:border-panel-edge focus:bg-bg"
      value={draft}
      aria-label="folder name"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => event.key === 'Enter' && commit()}
      {...tooltipHandlers(FOLDER_NAME_TIP)}
    />
  );
}

function CollapsedSummary({ run }: { run: NodeRun }) {
  return (
    <p className="truncate px-1 pb-0.5 text-[11px] text-ink-dim italic">
      {run.nodes.map((node) => node.label).join(' → ')}
    </p>
  );
}

function setFolderOfNodes(
  perform: (action: string, params: CommandParams) => unknown,
  nodeIds: readonly string[],
  folder: string,
): void {
  for (const nodeId of nodeIds) perform('set_folder', { node_id: nodeId, folder });
}

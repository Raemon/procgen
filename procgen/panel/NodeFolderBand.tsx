import { useState, type ReactNode } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { Button } from '../../frontend/controls/Button';
import { classes } from '../../frontend/controls/classes';
import { FOLDER_HOVER_GROUP, REVEALED_ON_FOLDER_HOVER } from '../../frontend/controls/revealOnRowHover';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import {
  collapseFolderTip,
  FOLDER_NAME_TIP,
  SAVE_TEMPLATE_TIP,
  UNGROUP_TIP,
} from './help/nodeCardTips';
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
      {collapsed ? <CollapsedSummary run={run} /> : <div className="flex flex-col gap-1">{children}</div>}
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
  const { perform } = useAppRuntime();
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
      <SaveAsTemplateButton run={run} />
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

function SaveAsTemplateButton({ run }: { run: NodeRun }) {
  const { perform } = useAppRuntime();
  const [saved, setSaved] = useState(false);
  function save(): void {
    perform('save_template', {
      name: run.folder,
      node_ids: run.nodes.map((node) => node.id),
      description: describeRun(run),
    });
    setSaved(true);
  }
  return (
    <Button
      className={classes(REVEALED_ON_FOLDER_HOVER, 'px-1.5 py-0.5 text-[11px]')}
      tip={SAVE_TEMPLATE_TIP}
      onClick={save}
    >
      {saved ? '✓' : '⤓'}
    </Button>
  );
}

function describeRun(run: NodeRun): string {
  return `Saved from the panel: ${run.nodes.map((node) => node.label).join(' → ')}.`;
}

function FolderNameInput({ folder, nodeIds }: { folder: string; nodeIds: string[] }) {
  const { perform } = useAppRuntime();
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
  perform: (action: string, params: Record<string, unknown>) => unknown,
  nodeIds: readonly string[],
  folder: string,
): void {
  for (const nodeId of nodeIds) perform('set_folder', { node_id: nodeId, folder });
}

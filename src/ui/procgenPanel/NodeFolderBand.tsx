import { useState, type ReactNode } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { templateFromNodes } from '../../procgen/templates/templateFromNodes';
import { Button } from '../controls/Button';
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
    <section className="rounded-md border border-dashed border-panel-edge bg-bg/40 p-1.5">
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
  const { store } = useAppRuntime();
  const nodeIds = run.nodes.map((node) => node.id);
  return (
    <div className="mb-1.5 flex items-center gap-[5px] px-0.5">
      <button
        type="button"
        className="cursor-pointer border-none bg-transparent p-0.5 text-[11px] text-ink-dim hover:text-ink"
        title="collapse / expand folder"
        onClick={onToggleCollapsed}
      >
        {collapsed ? '▸' : '▾'}
      </button>
      <FolderNameInput folder={run.folder} nodeIds={nodeIds} />
      <span className="text-[10px] whitespace-nowrap text-ink-dim">
        {run.nodes.length} node{run.nodes.length === 1 ? '' : 's'}
      </span>
      <SaveAsTemplateButton run={run} />
      <Button
        className="px-1.5 py-0.5 text-[11px]"
        title="ungroup — leaves every node exactly where it is"
        onClick={() => store.setFolderOfNodes(nodeIds, '')}
      >
        ⊘
      </Button>
    </div>
  );
}

function SaveAsTemplateButton({ run }: { run: NodeRun }) {
  const { templates } = useAppRuntime();
  const [saved, setSaved] = useState(false);
  function save(): void {
    templates.save(templateFromNodes(run.nodes, run.folder, describeRun(run)));
    setSaved(true);
  }
  return (
    <Button
      className="px-1.5 py-0.5 text-[11px]"
      title="save this folder as a template — wiring inside is kept, wiring to nodes outside is left open"
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
  const { store } = useAppRuntime();
  const [draft, setDraft] = useState(folder);
  const commit = () => draft.trim() && store.setFolderOfNodes(nodeIds, draft.trim());
  return (
    <input
      type="text"
      className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-[3px] text-xs font-semibold tracking-wide text-ink-dim uppercase hover:border-panel-edge hover:bg-bg focus:border-panel-edge focus:bg-bg"
      value={draft}
      title="folder name — grouping is for the panel only and never changes what is generated"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => event.key === 'Enter' && commit()}
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

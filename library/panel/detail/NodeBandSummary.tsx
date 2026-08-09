import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { tooltipHandlers } from '../../../frontend/tooltips/tooltipHandlers';
import type { NodeInstance } from '../../../procgen/pipeline/pipelineState';
import { nodeFolderRuns, type NodeRun } from '../../../procgen/panel/nodeFolderRuns';
import { openGroupTip } from '../../help/libraryTips';
import { useLibrarySelection } from '../useLibrarySelection';

export function NodeBandSummary({ nodes }: { nodes: readonly NodeInstance[] }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {nodeFolderRuns(nodes).map((run) => (
        <li key={run.startIndex} className="flex flex-col gap-1">
          <BandHeading run={run} />
          {run.nodes.map((node) => (
            <NodeLine key={node.id} node={node} />
          ))}
        </li>
      ))}
    </ol>
  );
}

function BandHeading({ run }: { run: NodeRun }) {
  const { templates } = useAppRuntime();
  const [, select] = useLibrarySelection();
  useSyncExternalStore(
    (listener) => templates.onChange(listener),
    () => templates.savedTemplates(),
  );
  if (run.folder === '') return null;
  if (!templates.byName(run.folder)) {
    return <span className="text-[10px] tracking-[0.08em] text-ink-dim uppercase">{run.folder}</span>;
  }
  return (
    <button
      type="button"
      className="w-full cursor-pointer text-left text-[10px] tracking-[0.08em] text-ink-dim uppercase hover:text-accent"
      onClick={() => select('groups', run.folder)}
      {...tooltipHandlers(openGroupTip(run.folder))}
    >
      {run.folder} ↗
    </button>
  );
}

function NodeLine({ node }: { node: NodeInstance }) {
  return (
    <div className="rounded border border-panel-edge bg-field px-1.5 py-1 text-xs text-ink">
      <span>{node.label}</span>
      <span className="ml-1.5 text-[10px] text-ink-dim">{node.type}</span>
    </div>
  );
}

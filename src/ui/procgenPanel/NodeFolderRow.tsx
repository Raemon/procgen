import { useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import { folderNamesIn } from './nodeFolderRuns';

const FOLDER_DATALIST_ID = 'procgen-folder-names';

export function NodeFolderRow({ node }: { node: NodeInstance }) {
  const { store, perform } = useAppRuntime();
  const [draft, setDraft] = useState(node.folder);
  return (
    <label className="mb-2 flex items-center gap-1.5 text-[11px] text-ink-dim">
      <span className="whitespace-nowrap">folder</span>
      <input
        type="text"
        list={FOLDER_DATALIST_ID}
        placeholder="ungrouped"
        title="Panel-only grouping. Adjacent nodes sharing a folder name fold into one band; nothing about generation changes."
        className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-[3px] text-[11px] text-ink-dim hover:border-panel-edge hover:bg-bg focus:border-panel-edge focus:bg-bg focus:text-ink"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => perform('set_folder', { node_id: node.id, folder: draft.trim() })}
        onKeyDown={(event) => event.key === 'Enter' && perform('set_folder', { node_id: node.id, folder: draft.trim() })}
      />
      <datalist id={FOLDER_DATALIST_ID}>
        {folderNamesIn(store.nodes()).map((folder) => (
          <option key={folder} value={folder} />
        ))}
      </datalist>
    </label>
  );
}

import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { useRerenderOnPipelineChange } from '../../frontend/rerenderHooks';
import { AddNodeMenu } from '../../procgen/panel/AddNodeMenu';
import { NodeList } from '../../procgen/panel/NodeList';
import { FOLDER_TIPS } from '../help/libraryTips';
import { LibraryFolder } from '../panel/LibraryFolder';
import { useLibrarySelection } from '../useLibrarySelection';

export function PipelineFolder() {
  const { store, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
  useRerenderOnPipelineChange();

  function addNodeAndSelectIt(type: string): void {
    const added = perform('add_node', { type });
    const node = added.ok ? store.nodes().at(-1) : undefined;
    if (node) select('pipeline', node.id);
  }

  return (
    <LibraryFolder folder="pipeline" tip={FOLDER_TIPS.pipeline} count={store.nodes().length}>
      <NodeList />
      <div className="mt-1.5">
        <AddNodeMenu onPick={addNodeAndSelectIt} />
      </div>
    </LibraryFolder>
  );
}

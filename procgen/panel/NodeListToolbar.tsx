import { Button } from '../../frontend/controls/Button';
import { PERSISTED_UI_KEYS } from '../../frontend/uiState/persistedUiKeys';
import { usePersistedUiSet } from '../../frontend/uiState/usePersistedUiSet';
import { useEditedPipeline } from './editing/editedPipelineContext';
import { CLEAR_PIPELINE_TIP, COLLAPSE_ALL_TIP, EXPAND_ALL_TIP } from './help/pipelineTips';

export function NodeListToolbar() {
  const { store, perform } = useEditedPipeline();
  const collapsedCards = usePersistedUiSet(PERSISTED_UI_KEYS.collapsedNodeCards);
  const nodeIds = store.nodes().map((node) => node.id);
  const anyExpanded = nodeIds.some((id) => !collapsedCards.has(id));
  if (nodeIds.length === 0) return null;
  return (
    <div className="flex justify-end gap-1.5">
      <Button
        className="px-2 py-0.5 text-[11px] hover:border-danger-edge hover:text-danger-ink"
        tip={CLEAR_PIPELINE_TIP}
        onClick={() => clearEveryNode(perform)}
      >
        clear
      </Button>
      <Button
        className="px-2 py-0.5 text-[11px]"
        tip={anyExpanded ? COLLAPSE_ALL_TIP : EXPAND_ALL_TIP}
        onClick={() => collapsedCards.replaceWith(anyExpanded ? nodeIds : [])}
      >
        {anyExpanded ? 'collapse all' : 'expand all'}
      </Button>
    </div>
  );
}

function clearEveryNode(perform: (action: string) => unknown): void {
  if (window.confirm('Remove every node from this world?')) perform('clear_pipeline');
}

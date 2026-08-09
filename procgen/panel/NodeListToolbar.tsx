import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { Button } from '../../frontend/controls/Button';
import { PERSISTED_UI_KEYS } from '../../frontend/uiState/persistedUiKeys';
import { usePersistedUiSet } from '../../frontend/uiState/usePersistedUiSet';
import { COLLAPSE_ALL_TIP, EXPAND_ALL_TIP } from './help/pipelineTips';

export function NodeListToolbar() {
  const { store } = useAppRuntime();
  const collapsedCards = usePersistedUiSet(PERSISTED_UI_KEYS.collapsedNodeCards);
  const nodeIds = store.nodes().map((node) => node.id);
  const anyExpanded = nodeIds.some((id) => !collapsedCards.has(id));
  if (nodeIds.length === 0) return null;
  return (
    <div className="flex justify-end">
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

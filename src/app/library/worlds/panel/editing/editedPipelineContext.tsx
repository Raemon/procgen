import { createContext, useCallback, useContext, useEffect, useReducer, type ReactNode } from 'react';
import type { EditedPipeline } from '../../editing/editedPipeline';

const EditedPipelineContext = createContext<EditedPipeline | null>(null);

export function EditedPipelineProvider({
  pipeline,
  children,
}: {
  pipeline: EditedPipeline;
  children: ReactNode;
}) {
  return (
    <EditedPipelineContext.Provider value={pipeline}>{children}</EditedPipelineContext.Provider>
  );
}

export function useEditedPipeline(): EditedPipeline {
  const pipeline = useContext(EditedPipelineContext);
  if (!pipeline) throw new Error('missing EditedPipelineProvider');
  return pipeline;
}

export function useRerenderOnEditedPipelineChange(): void {
  const { store } = useEditedPipeline();
  const subscribe = useCallback((listener: () => void) => store.onChange(listener), [store]);
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  useEffect(() => subscribe(rerender), [subscribe]);
}

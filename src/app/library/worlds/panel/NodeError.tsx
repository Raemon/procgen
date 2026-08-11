import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { useRerenderOnWorldChange } from '../../frontend/rerenderHooks';
import { useEditedPipeline } from './editing/editedPipelineContext';

export function NodeError({ nodeId }: { nodeId: string }) {
  const { evaluator } = useAppRuntime();
  const { rendered } = useEditedPipeline();
  useRerenderOnWorldChange();
  const message = rendered ? evaluator.errorFor(nodeId) : null;
  if (!message) return null;
  return <ErrorNote message={message} />;
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="mb-2 rounded border border-error-edge bg-error-bg px-[7px] py-[5px] text-[11px] break-words text-error-ink">
      {message}
    </div>
  );
}

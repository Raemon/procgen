import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';

export function attachAgentPipelineSync(store: PipelineStore): void {
  if (!import.meta.hot) return;
  import.meta.hot.on('agent-pipeline-changed', () => {
    void fetch('/persist/pipeline')
      .then((response) => (response.ok ? response.json() : null))
      .then((raw) => {
        if (raw) store.replaceAll(sanitizePipeline(raw));
      })
      .catch(() => undefined);
  });
}

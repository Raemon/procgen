import { serveAgentApi, type AgentApiState } from './agent/nodeEntry';
import type { DocStore } from '../server/persistence/docsRepo';
import type { Router } from './router';

export function mountAgentApi(
  router: Router,
  state: AgentApiState,
  docs: DocStore,
  onPipelinePersisted: () => void,
): void {
  router.mount('/api/v1', (req, res) => {
    void serveAgentApi(state, docs, req, res, onPipelinePersisted).catch((error: unknown) => {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'internal', message: String(error) }));
    });
  });
}

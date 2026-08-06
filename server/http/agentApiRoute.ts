import { serveAgentApi, type AgentApiState } from '../../src/agent/api/nodeEntry';
import type { Router } from './router';

export function mountAgentApi(
  router: Router,
  state: AgentApiState,
  root: string,
  onPipelinePersisted: () => void,
): void {
  router.mount('/api/v1', (req, res) => {
    void serveAgentApi(state, root, req, res, onPipelinePersisted).catch((error: unknown) => {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'internal', message: String(error) }));
    });
  });
}

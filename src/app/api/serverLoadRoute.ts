import type { IncomingMessage } from 'node:http';
import { EventLoopLagMonitor } from '../perf/eventLoopLagMonitor';
import { heaviestHostProcesses } from '../perf/heaviestHostProcesses';
import { serverProcessSnapshot } from '../perf/serverProcessSnapshot';
import { SERVER_LOAD_PATH, type ServerLoad } from '../perf/serverLoadContract';
import { sendJson, type Router } from './router';

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export function mountServerLoadRoute(router: Router): () => void {
  const lag = new EventLoopLagMonitor();
  lag.start();
  router.get(SERVER_LOAD_PATH, async (req, res) => {
    sendJson(res, 200, await serverLoadFor(req, lag.latestLagMs()));
  });
  return () => lag.stop();
}

async function serverLoadFor(req: IncomingMessage, eventLoopLagMs: number): Promise<ServerLoad> {
  const mayListHostProcesses = requestCameFromThisMachine(req);
  return {
    process: serverProcessSnapshot(),
    eventLoopLagMs,
    hostProcesses: mayListHostProcesses ? await heaviestHostProcesses() : [],
    hostProcessesWithheld: !mayListHostProcesses,
  };
}

function requestCameFromThisMachine(req: IncomingMessage): boolean {
  if (req.headers['x-forwarded-for'] !== undefined) return false;
  return LOOPBACK_ADDRESSES.has(req.socket.remoteAddress ?? '');
}

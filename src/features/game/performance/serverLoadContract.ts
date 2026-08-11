import type { HostProcess } from './heaviestHostProcesses';
import type { ServerProcessSnapshot } from './serverProcessSnapshot';

export const SERVER_LOAD_PATH = '/api/v1/game/performance';

export interface ServerLoad {
  process: ServerProcessSnapshot;
  eventLoopLagMs: number;
  hostProcesses: HostProcess[];
  hostProcessesWithheld: boolean;
}
